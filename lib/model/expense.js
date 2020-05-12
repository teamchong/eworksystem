
"use strict";

var
    _       = require('underscore'),
    moment  = require('moment'),
    Promise = require("bluebird");

module.exports = function(sequelize, DataTypes) {
    var Expense = sequelize.define("Expense", {
        // TODO add validators!
        'status' : {
            type      : DataTypes.INTEGER,
            allowNull : false
        },
        employee_comment : {
            type      : DataTypes.STRING,
            allowNull : true,
        },
        approver_comment : {
            type      : DataTypes.STRING,
            allowNull : true,
        },
        decided_at : {
            type      : DataTypes.DATE,
            allowNull : true,
        },
        expense_amount : {
            type         : DataTypes.FLOAT,
            allowNull    : false,
            defaultValue : 0,
        },
    }, {

      indexes : [
        {
          fields : ['userId'],
        },
        {
          fields : ['expenseTypeId'],
        },
        {
          fields : ['approverId'],
        },
      ],
      classMethods : {
        associate : function( models ){
          Expense.belongsTo(models.User, { as : 'user',foreignKey     : 'userId' });
          Expense.belongsTo(models.User, { as : 'approver',foreignKey : 'approverId' });
          Expense.belongsTo(models.ExpenseType, { as : 'expense_type' } );
          Expense.hasMany(models.Comment, {
            as : 'comments',
            foreignKey: 'companyId',
            scope: {
              entityType: models.Comment.getEntityTypeExpense(),
            },
          });
        },

        status_new           : () => 1,
        status_approved      : () => 2,
        status_rejected      : () => 3,
        status_pended_revoke : () => 4,
        status_canceled      : () => 5,
      },

      instanceMethods : {

reloadWithAssociates : function() {
  const self = this;

  return self.reload({
    include : [
      {model : self.sequelize.models.User,      as : 'user'},
      {model : self.sequelize.models.User,      as : 'approver'},
      {model : self.sequelize.models.ExpenseType, as : 'expense_type'},
    ],
  });
},

is_new_expense : function() {
    return this.status === Expense.status_new();
},

is_pended_revoke_expense : function(){
  return this.status === Expense.status_pended_revoke();
},

// Expense is treated as "approved" one if it is in approved staus
// or if it is waiting decision on revoke action
//
is_approved_expense : function() {
  return this.status === Expense.status_approved() ||
    this.status === Expense.status_pended_revoke() ;
},

promise_to_reject : function(args) {
  let self = this;

  if ( ! args ) {
    args = {};
  }

  if ( ! args.by_user ) {
    throw new Error('promise_to_reject has to have by_user parameter');
  }

  let by_user = args.by_user;

  // See explanation to promise_to_approve
  self.status = self.is_pended_revoke_expense() ?
    Expense.status_approved():
    Expense.status_rejected();

  self.approverId = by_user.id;

  return self.save();
},

promise_to_approve : function(args) {
  let self = this;

  if ( ! args ) {
    args = {};
  }

  if ( ! args.by_user ) {
    throw new Error('promise_to_approve has to have by_user parameter');
  }

  let by_user = args.by_user;

  // If current expense is one with requested revoke, then
  // approve action set it into Rejected status
  // otherwise it is approve action for new expense
  // so put expense into Approved
  self.status = self.is_pended_revoke_expense() ?
    Expense.status_rejected():
    Expense.status_approved();

  self.approverId = by_user.id;

  return self.save();
},

promise_to_revoke : function(){
  let self = this;

  return self.getUser({
      include : [
        {
          model : sequelize.models.Department,
          as    : 'department',
        }
      ],
    })
    .then(function(user){

      var new_expense_status = user.is_auto_approve()
        ? Expense.status_rejected()
        : Expense.status_pended_revoke();

      // By default it is user main boss is one who has to approve the revoked request
      self.approverId = user.department.bossId;

      self.status = new_expense_status;

      return self.save();
    });
},

promise_to_cancel : function(){
  var self = this;

  if ( ! self.is_new_expense() ) {
    throw new Error('An attempt to cancel non-new expense request id : '+self.id);
  }

  self.status = Expense.status_canceled();

  return self.save();
},

get_expense_type_name : function() {
  var expense_type = this.get('expense_type');

  if (! expense_type ) {
    return '';
  } else {
    return expense_type.name;
  }
},

promise_approver : function() {

  return this.getApprover({
    include : [{
      model : sequelize.models.Company,
      as : 'company',
      include : [{
        model : sequelize.models.BankHoliday,
        as : 'bank_holidays',
      }],
    }],
  })
},


        },
    });

    return Expense;
};
