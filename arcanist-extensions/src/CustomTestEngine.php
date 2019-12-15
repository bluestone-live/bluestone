<?php
/**
 * This class integrates the various testing commands to `arc unit` workflow.
 * Since truffle does not generate test reports, it's difficult for us to get
 * details for each test case. For now, because all we need is success/fail
 * signal from `arc unit` workflow, we simply check if there is any error
 * and pass in one ArcanistUnitTestResult to indicate if tests are passed.
 *
 * https://secure.phabricator.com/book/phabricator/article/arcanist_lint_unit/
 * https://secure.phabricator.com/diffusion/ARC/browse/master/src/unit/engine/PytestTestEngine.php
 * https://github.com/metno/arcanist-support/blob/master/src/unit/SBTTestEngine.php
 */

final class CustomTestEngine extends ArcanistUnitTestEngine {
  public function run() {
    $arcanist_src_dir=__DIR__; // which will be '$DEV_DIR/bluestone/arcanist-extensions/src/'
    $project_root=$arcanist_src_dir.'/../..';
    chdir($project_root);

    $testCommands = $this->collectTestCommands();
    $hasError = false;

    foreach ($testCommands as $cmd) {
      $future = new ExecFuture($cmd);

      // return code
      $retCode = 0; 

      do {
        // print out every 50ms 
        // resolve returns null if the timeout is hit.
        // ref: https://secure.phabricator.com/book/libphutil/class/Future/#method/resolve
        $result = $future->resolve(0.05); 
        list($stdout, $stderr) = $future->read(); 
        echo $stdout;
        echo $stderr;   

        // When the future is resolved, result[0] would be the 
        // return code of the command. 
        $retCode = $result === null ? 0 : $result[0];

      } while ($result === null);


      if ($retCode != 0) {
        $hasError = true;
        break;
      }
    }

    $testResults = array();
    $res = new ArcanistUnitTestResult();
    $res->setName('Test');

    if ($hasError) {
      $res->setResult(ArcanistUnitTestResult::RESULT_FAIL);
    } else {
      $res->setResult(ArcanistUnitTestResult::RESULT_PASS);
    }

    array_push($testResults, $res);

    return $testResults;
  }

  private function collectTestCommands() {
    $testCommands = array();

    if ($this->shouldRunTruffleTest()) {
      array_push($testCommands, 'npx truffle test');
    }

    if ($this->shouldRunClientTest()) {
      array_push($testCommands, 'yarn test:client');
    }

    return $testCommands;
  }

  private function shouldRunTruffleTest() {
    $future = new ExecFuture("git diff HEAD^ --name-only contracts/ libs/ migrations/ scripts/ test/ | egrep '/*.(sol|js)$'");
    list ($error, $stdout, $stderr) = $future->resolve();
    return $stdout != '';
  }

  private function shouldRunClientTest() {
    $future = new ExecFuture("git diff HEAD^ --name-only client/ | egrep '/*.(ts|tsx|js)$'");
    list ($error, $stdout, $stderr) = $future->resolve();
    return $stdout != '';
  }
}
