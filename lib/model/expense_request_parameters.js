
'use strict';

var
    _      = require('underscore'),
    model  = require('../model/db'),
    moment = require('moment');

function ExpenseRequest(args) {
    var me = this;

    // Make sure all required data is provided
    _.each(
        [
          'expense_type','expense_amount', 'reason'
        ],
        function(property){
            if (! _.has(args, property)) {
                throw new Error('No mandatory '+property+' was provided to ExpenseRequest constructor');
            }
        }
    );

    // Expense amount should be greater than zero
    if ((parseFloat(args.expense_amount) || 0) <= 0){
        throw new Error( 'Amount should be greater than zero' );
    }

    _.each(
        [
          'expense_type','expense_amount', 'reason', 'user'
        ],
        function(property){ me[property] = args[property]; }
    );
}

ExpenseRequest.prototype.as_data_object = function(){
    var obj = {},
        me = this;

    _.each(
        [
          'expense_type','expense_amount', 'reason', 'user'
        ],
        function(property){ obj[property] = me[property]; }
    );

    return obj;
};


module.exports = ExpenseRequest;
