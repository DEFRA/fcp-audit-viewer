import Joi from 'joi'

export const VALID_FIELDS = [
  'user',
  'sessionid',
  'correlationid',
  'datetime',
  'environment',
  'version',
  'application',
  'component',
  'ip',
  'audit.status',
  'audit.entities.entity',
  'audit.entities.action',
  'audit.entities.entityid',
  'audit.accounts.sbi',
  'audit.accounts.frn',
  'audit.accounts.vendor',
  'audit.accounts.trader',
  'audit.accounts.organisationId',
  'audit.accounts.crn',
  'audit.accounts.personId'
]

export const VALID_OPERATORS = ['eq', 'ne', 'lt', 'gt', 'contains', 'notContains']

export const conditionSchema = Joi.object({
  field: Joi.string().valid(...VALID_FIELDS).allow('').default(''),
  // customField must be a plain identifier — no dots or path separators
  customField: Joi.string().pattern(/^[\w-]+$/).max(100).allow('').default(''),
  operator: Joi.string().valid(...VALID_OPERATORS).default('eq'),
  value: Joi.string().allow('').optional()
})
