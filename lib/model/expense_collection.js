
"use strict";

var
  Promise = require('bluebird'),
  moment  = require('moment'),
  _       = require('underscore'),
  config  = require('../config');

function promise_to_group_expenses(expenses) {

  if ( ! expenses ) {
    throw new Error('Did not get "expenses" in promise_to_group_expenses');
  }

  let grouped_expenses = {};

  // Group expenses by years
  expenses.forEach(expense => {
    let year = moment.utc(expense.get_start_expense_day().date).format('YYYY');

    if ( ! grouped_expenses[year]) {
      grouped_expenses[ year ] = {
        year : year,
        expenses : [],
      };
    }

    grouped_expenses[ year ].expenses.push(expense);
  });

  // Sort year groups
  grouped_expenses = _
    .values( grouped_expenses )
    .sort((a,b) => a.year > b.year ? -1 : a.year < b.year ? 1 : 0);

  // Calculate total allowance deduction per group
  grouped_expenses.forEach(group => {
    group.total_deduction = _.reduce(
      group.expenses.map(expense => expense.get_deducted_days_number()),
      (memo, number) => memo + number,
      0
    );
  });

  return Promise.resolve(grouped_expenses);
}

/*
 * Simple function that sorts array of Expense objects in default way.
 *
 * */

function promise_to_sort_expenses(expenses) {
  return Promise.resolve( expenses.sort(
    (a,b) => a.decided_at > b.decided_at
      ? -1 : a.decided_at < b.decided_at
      ? 1 : 0
  ));
}

module.exports = function(){
  return {
    promise_to_group_expenses : promise_to_group_expenses,
    promise_to_sort_expenses : promise_to_sort_expenses,
  };
};
