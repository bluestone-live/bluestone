pragma solidity ^0.5.0;

import "../Configuration.sol";


contract ConfigurationMock is Configuration {
    constructor() public {
        setLoanInterestRate(1, 1e10);
        setLoanInterestRate(7, 3e10);
        setLoanInterestRate(30, 5e10);

        // a11 + a71 + a301 = 1
        setCoefficient(1, 1, 3e17);
        setCoefficient(7, 1, 3e17);
        setCoefficient(30, 1, 4e17);

        // a77 + a307 = 1
        setCoefficient(7, 7, 5e17);
        setCoefficient(30, 7, 5e17);

        // a3030 = 1
        setCoefficient(30, 30, 1e18);
    }
}
