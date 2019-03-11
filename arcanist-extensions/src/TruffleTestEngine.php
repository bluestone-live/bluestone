<?php
/**
 * This class integrates the testing command from Truffle to `arc unit` workflow.
 * Since truffle does not generate test reports, it's difficult for us to get 
 * details for each test case. For now, because all we need is success/fail 
 * signal from `arc unit` workflow, we simply check if there is any error 
 * and pass in one ArcanistUnitTestResult to indicate if tests are passed.
 *
 * https://secure.phabricator.com/book/phabricator/article/arcanist_lint_unit/
 * https://secure.phabricator.com/diffusion/ARC/browse/master/src/unit/engine/PytestTestEngine.php
 * https://github.com/metno/arcanist-support/blob/master/src/unit/SBTTestEngine.php
 */

final class TruffleTestEngine extends ArcanistUnitTestEngine {
  protected $truffleCommand = 'npx truffle test';

  public function run() {
    $future = new ExecFuture($this->truffleCommand);
    list ($error, $stdout, $stderr) = $future->resolve();

    echo $stdout;
    echo $stderr;
    
    return $this->parseTestResults($error);
  }

  private function parseTestResults($error) {
    $results = array();
    $res = new ArcanistUnitTestResult();
    $res->setName('Truffle test');

    // $error represents the number of failed tests
    if ($error > 0) {
      $res->setResult(ArcanistUnitTestResult::RESULT_FAIL);
    } else {
      $res->setResult(ArcanistUnitTestResult::RESULT_PASS);
    }

    array_push($results, $res);

    return $results;
  }
}
