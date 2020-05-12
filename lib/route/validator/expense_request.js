
'use strict';

var validator = require('validator'),
    ExpenseRequestParameters = require('../../model/expense_request_parameters');

module.exports = function(args){
    var req = args.req;

    var user           = validator.trim( req.body['user'] ),
        expense_type     = validator.trim( req.body['expense_type'] ),
        expense_amount   = validator.trim( req.body['expense_amount'] ),
        reason         = validator.trim( req.body['reason'] );

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
        expense_type     : expense_type,
        expense_amount   : expense_amount,
        reason         : reason,
    };

    if ( user ) {
        valid_attributes.user = user;
    }

    return new ExpenseRequestParameters( valid_attributes );
};
