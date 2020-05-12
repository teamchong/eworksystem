
"use strict"

const
  Promise   = require('bluebird'),
  Joi       = require('joi'),
  moment    = require('moment'),
  Exception = require('../../error'),
  {commentExpense} = require('../comment'),
  Models    = require('../db');

const
  schemaCreateNewExpense = Joi.object().required().keys({
    for_employee    : Joi.object().required(),
    of_type         : Joi.string().required(),
    with_parameters : Joi.object().required(),
  });

/*
 * Create new expense for provided parameters.
 * Returns promise that is resolved with newly created expense row
 * */
function createNewExpense(args){

  args = Joi.attempt(
    args,
    schemaCreateNewExpense,
    "Failed to validate arguments"
  );

  const
    employee          = args.for_employee,
    expense_type      = args.of_type,
    valide_attributes = args.with_parameters;

  const
    start_date = moment.utc(),
    expense_amount = parseFloat(valide_attributes.expense_amount) || 0;

  // Check that expense amount is greater than zero
  if ( expense_amount <= 0 ) {
    Exception.throwUserError({
      user_error   : "Amount should be greater than zero",
      system_error : `Failed to add new Expense for user ${ employee.id } `
        `because amount is not greater than zero`,
    });
  }

  const comment = valide_attributes.reason,
    companyId = employee.companyId;

  // Make sure that booking to be created is not going to ovelap with
  // any existing bookings
  return Promise

    .try(() => employee.promise_boss())
    .then(main_supervisor => {

      const new_expense_status = employee.is_auto_approve()
        ? Models.Expense.status_approved()
        : Models.Expense.status_new();

      // Following statement creates in memory only expense object
      // it is not in database until .save() method is called
      return Promise.resolve(Models.Expense.build({
        userId           : employee.id,
        status           : new_expense_status,
        approverId       : main_supervisor.id,
        employee_comment : valide_attributes.reason,

        date_start       : start_date.format('YYYY-MM-DD'),
        expense_type     : expense_type,
        expense_amount   : expense_amount,
      }));
    })

    .then(expense_to_create =>
      expense_to_create.save()
    )
    .then(expense => commentExpenseIfNeeded({expense,comment,companyId}).then(() => expense))
    .then(expense => Promise.resolve(expense));
}

const commentExpenseIfNeeded = ({expense,comment, companyId}) => {
  return comment ? commentExpense({expense,comment,companyId}) : Promise.resolve();
};

module.exports = {
  createNewExpense : createNewExpense,
}
