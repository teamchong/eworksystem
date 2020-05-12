
'use strict';

var validator = require('validator'),
    ExpenseRequestParameters = require('../../model/expense_request_parameters');

module.exports = function(args){
    var req = args.req;

    var user           = validator.trim( req.body['user'] ),
        date_start      = validator.trim( req.body['date_start'] ),
        expense_type     = validator.trim( req.body['expense_type'] ),
        expense_amount   = validator.trim( req.body['expense_amount'] ),
        reason         = validator.trim( req.body['reason'] );

    var date_validator = function(date_str, label) {
      try {

        // Basic check
        if (! date_str ) throw new Error("date needs to be defined");

        date_str = req.user.company.normalise_date(date_str);

        // Ensure that normalisation went OK
        if (! validator.isDate(date_str)) throw new Error("Invalid date format");

      } catch (e) {
        console.log('Got an error ' + e);
        req.session.flash_error(label + ' should be a date');
      }
    }

    date_validator(date_start, 'Start date');

    if (user && !validator.isNumeric(user)){
        req.session.flash_error('Incorrect employee');
    }

    if ((parseFloat(expense_amount) || 0) <= 0){
        req.session.flash_error('Amount should be greater than zero');
    }

    // Check if it makes sence to continue validation (as following code relies on
    // to and from dates to be valid ones)
    if ( req.session.flash_has_errors() ) {
      throw new Error( 'Got validation errors' );
    }

    var valid_attributes = {
        date_start     : date_start,
        expense_type     : expense_type,
        expense_amount   : expense_amount,
        reason         : reason,
    };

    if ( user ) {
        valid_attributes.user = user;
    }

    return new ExpenseRequestParameters( valid_attributes );
};
