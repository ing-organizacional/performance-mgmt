/**
 * Assignments & Company Items Translation Types
 * 
 * Defines translation types for the assignment management system,
 * including company-wide items, individual assignments, OKRs, and
 * competency management interfaces.
 */

export interface AssignmentsTranslations {
  assignmentManager: string
  manageOKRsCompetencies: string
  companyWideItems: string
  companyWideDescription: string
  appliedToAllEmployees: string
  selectEmployeesForBatch: string
  selectEmployees: string
  itemsAssigned: string
  employeesSelected: string
  assignToSelected: string
  individualAssignments: string
  individualDescription: string
  comingSoon: string
  createNewDepartmentItems: string
  newOKR: string
  newCompetency: string
  create: string
  evaluationDeadline: string
  departmentLevelAssignments: string
  departmentDescription: string
  currentlyAssignedTo: string
}

export interface CompanyItemsTranslations {
  title: string
  subtitle: string
  infoTitle: string
  infoDescription: string
  createNewTitle: string
  newCompanyOKR: string
  newCompanyCompetency: string
  existingItemsTitle: string
  itemsAppliedToAll: string
  objective: string
  competencyName: string
  keyResults: string
  description: string
  activate: string
  deactivate: string
  active: string
  inactive: string
  createdBy: string
  appliedToAllEmployees: string
  noItemsTitle: string
  noItemsDescription: string
  companyOKR: string
  companyCompetency: string
  companyWide: string
  confirmDeactivate: string
  confirmActivate: string
  deactivateWarning: string
  activateWarning: string
}

export interface OKRsTranslations {
  objective: string
  keyResults: string
}