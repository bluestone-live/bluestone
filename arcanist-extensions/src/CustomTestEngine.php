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
    $testCommands = $this->collectTestCommands();
    $hasError = false;

    foreach ($testCommands as $cmd) {
      $future = new ExecFuture($cmd);
      list ($error, $stdout, $stderr) = $future->resolve();

      echo $stdout;
      echo $stderr;

      if ($error > 0) {
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
      array_push($testCommands, 'cd client && yarn test');
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
