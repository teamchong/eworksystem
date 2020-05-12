
'use strict';

const
  Bluebird = require('bluebird'),
  Models = require('./db');

const commentLeave = ({leave, comment, companyId}) => {
  return Models.Comment.create({
    entityType: Models.Comment.getEntityTypeLeave(),
    entityId: leave.id,
    comment,
    companyId,
    byUserId: leave.userId,
  });
};

const getCommentsForLeave = ({leave}) => {
  return Models.Comment.findAll({
    raw: true,
    where : {
      entityType: Models.Comment.getEntityTypeLeave(),
      entityId: leave.id,
    },
  });
};

const commentExpense = ({expense, comment, companyId}) => {
  return Models.Comment.create({
    entityType: Models.Comment.getEntityTypeExpense(),
    entityId: expense.id,
    comment,
    companyId,
    byUserId: expense.userId,
  });
};

const getCommentsForExpense = ({expense}) => {
  return Models.Comment.findAll({
    raw: true,
    where : {
      entityType: Models.Comment.getEntityTypeExpense(),
      entityId: expense.id,
    },
  });
};

module.exports = {
  commentLeave,
  getCommentsForLeave,
  commentExpense,
  getCommentsForExpense,
};
