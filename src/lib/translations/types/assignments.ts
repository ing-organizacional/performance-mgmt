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
  clickOrangeButtonConfirm: string
  cannotRemoveEvaluated: string
  contactHRForAssistance: string
  evaluatedItemsProtected: string
  hrOverrideRequired: string
  hrForceRemove: string
  confirmHROverride: string
  removeEvaluatedItem: string
  willPermanentlyDelete: string
  reasonForRemoval: string
  reasonRequired: string
  confirmOverride: string
  hrOverrideSuccess: string
  evaluationDataCleared: string
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
  
  // Archive-related translations
  archive: string
  archived: string
  archivedItems: string
  archivedItemsTitle: string
  archiveInactiveItem: string
  confirmArchive: string
  archiveWarning: string
  archiveReason: string
  archiveReasonPlaceholder: string
  archiving: string
  archiveItem: string
  viewArchived: string
  hideArchived: string
  archivedOKRs: string
  archivedCompetencies: string
  archivedOn: string
  archivedBy: string
  reason: string
  viewArchivedItems: string
  details: string
  noArchivedItems: string
  noArchivedItemsDescription: string
  searchArchived: string
  searchResults: string
  noMatchingItems: string
  clearSearch: string
  searchHelp: string
  seeAllArchived: string
  unarchive: string
  delete: string
  confirmUnarchive: string
  confirmDelete: string
  unarchiveWarning: string
  deleteWarning: string
  deleteDataIntegrityWarning: string
  unarchiving: string
  deleting: string
  actions: string
  successUnarchived: string
  successDeleted: string
  successArchived: string
  successActivated: string
  successDeactivated: string
  
  // Error messages
  errors: {
    deadlineTomorrowOrLater: string
    failedToCreate: string
    failedToSave: string
    failedToToggleStatus: string
    errorCreating: string
    errorSaving: string
    errorToggling: string
    failedToArchive: string
    errorArchiving: string
    failedToFetchArchived: string
    errorFetchingArchived: string
  }
}

export interface OKRsTranslations {
  objective: string
  keyResults: string
}

export interface OversightTranslations {
  title: string
  subtitle: string
  allDepartmentItems: string
  description: string
  searchPlaceholder: string
  filterByDepartment: string
  filterByManager: string
  filterByType: string
  allDepartments: string
  allManagers: string
  allTypes: string
  noItemsFound: string
  noItemsDescription: string
  assignedEmployees: string
  createdBy: string
  department: string
  manager: string
  type: string
  itemDetails: string
  assignedTo: string
  employees: string
  okrType: string
  competencyType: string
  viewAssignments: string
  manageItem: string
  departmentOverview: string
  totalItems: string
  totalAssignments: string
}