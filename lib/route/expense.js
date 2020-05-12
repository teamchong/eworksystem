
"use strict";

var express   = require('express'),
    router    = express.Router(),
    Promise   = require('bluebird'),
    moment    = require('moment'),
    _         = require('underscore'),
    validator = require('validator'),
    get_and_validate_expense_params = require('./validator/expense_request'),
    TeamView                      = require('../model/team_view'),
    EmailTransport                = require('../email'),
    createNewExpense = require('../model/expense').createNewExpense;

router.post('/newexpense/', function(req, res){
    Promise.join (
      req.user.promise_users_I_can_manage(),
      req.user.getCompany(),
      Promise.try( () => get_and_validate_expense_params({req})),
      (users, company, valide_attributes) => {

        // Make sure that indexes submitted map to existing objects
        var employee = users[valide_attributes.user] || req.user,
          expense_type = valide_attributes.expense_type;

        if (!employee) {
          req.session.flash_error('Incorrect employee');
          throw new Error( 'Got validation errors' );
        }

        return createNewExpense({
          for_employee    : employee,
          of_type         : expense_type,
          with_parameters : valide_attributes,
        });
      }
    )
    .then(expense => expense.reloadWithAssociates())
    .then(expense => (new EmailTransport()).promise_expense_request_emails({expense}))
    .then(function(){

        req.session.flash_message('New expense request was added');
        return res.redirect_with_session(
          req.body['redirect_back_to']
            ? req.body['redirect_back_to']
            : '../'
        );
    })

    .catch(function(error){
        console.error(
            'An error occured when user '+req.user.id+
            ' try to create a expense request: '+error+
            ' at: ' + error.stack
        );
        req.session.flash_error('Failed to create a expense request [' + error + '] ' + (typeof createNewExpense));
        if (error.hasOwnProperty('user_message')) {
            req.session.flash_error(error.user_message);
        }
        return res.redirect_with_session(
          req.body['redirect_back_to']
            ? req.body['redirect_back_to']
            : '../'
        );
    });

});

router.get('/', function(req, res) {
  var current_year = validator.isNumeric(req.query['year'])
    ? moment.utc(req.query['year'], 'YYYY')
    : req.user.company.get_today();

  var show_full_year = validator.toBoolean(req.query['show_full_year']);

  Promise.join(
    req.user.reload_with_expense_details({ year : current_year }),
    req.user.promise_supervisors(),
    req.user.promise_allowance({ year : current_year }),
    function(company, user, supervisors, user_allowance){
      res.render('expense', {
        company        : company,
        title          : 'Expense',
        current_user   : user,
        supervisors    : supervisors,
        previous_year  : moment.utc(current_year).add(-1,'year').format('YYYY'),
        current_year   : current_year.format('YYYY'),
        next_year      : moment.utc(current_year).add(1,'year').format('YYYY'),
        show_full_year : show_full_year,

        // User allowance object is simple object with attributes only
        user_allowance : user_allowance,
      });
    }
  );

});

module.exports = router;
