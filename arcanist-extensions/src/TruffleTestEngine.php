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
  public function run() {
    if ($this->shouldTest()) {
      $future = new ExecFuture('npx truffle test');
      list ($error, $stdout, $stderr) = $future->resolve();

      echo $stdout;
      echo $stderr;
      
      return $this->parseTestResults($error);
    } else {
      echo "No test needed. \n";

      return $this->parseTestResults(0);
    }
  }

  /**
   * Determine whether we need to run test by inspecting changed files relative to 
   * the previous commit and check if certain file types are present. For example, 
   * test is not needed if I only touched markdown files.
   *
   * NOTE: This is a very naive strategy. As our project grows, we should switch 
   * to a more sophiscated strategy which could detect the scopes of our change, 
   * i.e., contract, client, server, or any combinations, and run relavent tests.
   */
  private function shouldTest() {
    $future = new ExecFuture("git diff HEAD^ --name-only | egrep '/*.(sol|js)'");
    list ($error, $stdout, $stderr) = $future->resolve();

    return $stdout != '';
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
