export const ROLES = {
  ADMIN: "ADMIN",
  SUBADMIN: "SUBADMIN",
  MANAGEMENT: "MANAGEMENT",
  USER: "USER",
  MANAGER: "MANAGER",
  STOREINCHARGE: "STOREINCHARGE",
} as const;
export type ROLES_TYPE = keyof typeof ROLES;



export const TRANSACTION = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  INWARDS:"INWARDS",
  OUTWARDS:"OUTWARDS"
} as const;
export type TRANSACTION_TYPE = keyof typeof TRANSACTION;



export const DEPARTMENT = {
  ACCOUNTS: "ACCOUNTS",
  PPC: "PPC",
  PURCHASE: "PURCHASE",
  STORES: "STORES",
  QUALITY: "QUALITY",
  FACTORYONE: "FACTORYONE",
  DEPARTMENT: "DEPARTMENT",
} as const;
export type DEPARTMENT_TYPE = keyof typeof DEPARTMENT;

export const GENERALSTATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CREATED: "CREATED",
  COMPLETED: "COMPLETED",
  POGENERATED: "POGENERATED",
  GRNCREATED: "GRNCREATED",
  QCCOMPLETED: "QCCOMPLETED",
  QCPENDING: "QCPENDING",
  QCPARTIAL: "QCPARTIAL",
  WORKORDERPENDING: "WORKORDERPENDING",
  WORKORDERGENERATED: "WORKORDERGENERATED",
} as const;
export type GENERALSTATUS_TYPE = keyof typeof GENERALSTATUS;



export const CUSTOMER_STATUS = {
  ACTIVE: "ACTIVE",

} as const;
export type CUSTOMER_STATUS_TYPE = keyof typeof CUSTOMER_STATUS;


export const SALE_ORDER_STATUS = {
  SENTTOSTORE: "SENTTOSTORE",
  INPRODUCTION: "INPRODUCTION",
  PURCHASEINTENTCREATED: "PURCHASEINTENTCREATED",
} as const;
export type SALE_ORDER_STATUS_TYPE = keyof typeof SALE_ORDER_STATUS;

export const STAGES = {
  EXTRUSION: "EXTRUSION",
  PRINTING: "PRINTING",
  LAMINATION: "LAMINATION",
  COATING: "COATING",
  SLITTING: "SLITTING",
  REWINDING: "REWINDING",
} as const;
export type STAGES_TYPE = keyof typeof STAGES;

export const FILM_TYPE = {
  BREATHABLE: "BREATHABLE",
  NONBREATHABLE: "NONBREATHABLE",
} as const;
export type FILM_TYPE_TYPE = keyof typeof FILM_TYPE;

export const PRINTING_TYPE = {
  PRINTED: "PRINTED",
  UNPRINTED: "UNPRINTED",
} as const;
export type PRINTING_TYPE_TYPE = keyof typeof PRINTING_TYPE;


export const LAMINATION_TYPE = {
  LAMINATED: "LAMINATED",
} as const;
export type LAMINATION_TYPE_TYPE = keyof typeof LAMINATION_TYPE;

export const LAMINATION_TYPES = {
  FULLLAMINATION:"FULL LAMINATION",
  PARTIALLAMINATION:"PARTIAL LAMINATION",
  INLINELAMINATION:"IN LINE LAMINATION",
} as const;
export type LAMINATION_TYPES_TYPE = keyof typeof LAMINATION_TYPES;
export const COATING_TYPE = {
  COATED: "COATED",
} as const;
export type COATING_TYPE_TYPE = keyof typeof COATING_TYPE;

export const SERIES_TYPE = {
  INDENT: "INDENT",
  PO: "PO",
} as const;
export type SERIES_TYPE_TYPE = keyof typeof SERIES_TYPE;

export const SERIES_FOR = {
  GENERAL: "GENERAL",
  RAW_MATERIAL: "RAW_MATERIAL",
  PACKING_MATERIAL: "PACKING_MATERIAL",
  PROCESS_CONSUMABLE: "PROCESS_CONSUMABLE",
  ENGINEERING_ITEMS: "ENGINEERING_ITEMS",
  ENGINEERING_MACHINERY: "ENGINEERING_MACHINERY",
  HARDWARE_AND_ELECTRICAL: "HARDWARE_AND_ELECTRICAL",
  HOUSE_KEEPING_AND_STATIONARY: "HOUSE_KEEPING_AND_STATIONARY",
  JOB_WORK_AND_REPARING_AND_SERVICE_AMC:"JOB_WORK_AND_REPARING_AND_SERVICE_AMC",
} as const;
export type SERIES_FOR_TYPE = keyof typeof SERIES_FOR;




export const LAMINATION_STATES_TYPE = {
  NonWoven: "Non Woven",
  FILM: "Film",
} as const;
export type LAMINATION_STATES_TYPE_TYPE = keyof typeof LAMINATION_STATES_TYPE;






export const SERIES_GENERATOR_CONFIG = [
  {
    series_for: SERIES_FOR.GENERAL,
    series_type: SERIES_TYPE.INDENT,
    str: "GENRAL-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.GENERAL,
    series_type: SERIES_TYPE.PO,
    str: "GENRAL-PO-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.RAW_MATERIAL,
    series_type: SERIES_TYPE.INDENT,
    str: "PPC-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.RAW_MATERIAL,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/RM/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.PACKING_MATERIAL,
    series_type: SERIES_TYPE.INDENT,
    str: "STR-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.PACKING_MATERIAL,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/PM/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.PROCESS_CONSUMABLE,
    series_type: SERIES_TYPE.INDENT,
    str: "PRT-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.PROCESS_CONSUMABLE,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/PC/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.ENGINEERING_MACHINERY,
    series_type: SERIES_TYPE.INDENT,
    str: "MNT-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.ENGINEERING_ITEMS,
    series_type: SERIES_TYPE.INDENT,
    str: "MNT-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.ENGINEERING_MACHINERY,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/E/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.HARDWARE_AND_ELECTRICAL,
    series_type: SERIES_TYPE.INDENT,
    str: "MNT-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.HARDWARE_AND_ELECTRICAL,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/J/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.HOUSE_KEEPING_AND_STATIONARY,
    series_type: SERIES_TYPE.INDENT,
    str: "HRA-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.HOUSE_KEEPING_AND_STATIONARY,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/S/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },

  {
    series_for: SERIES_FOR.JOB_WORK_AND_REPARING_AND_SERVICE_AMC,
    series_type: SERIES_TYPE.INDENT,
    str: "WOR-{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
  {
    series_for: SERIES_FOR.JOB_WORK_AND_REPARING_AND_SERVICE_AMC,
    series_type: SERIES_TYPE.PO,
    str: "SHFPL/W/{counter}/{financialYear}",
    financialYear: true,
    counter: true,
  },
] as const;

export type SERIES_GENERATOR_CONFIG_ITEM_TYPE = (typeof SERIES_GENERATOR_CONFIG)[number];


export const RAW_MATERIAL_CATEGORY_TYPE = {
  INHOUSE: "INHOUSE",
  PURCHASED: "PURCHASED"
} as const


export type RAW_MATERIAL_CATEGORY_TYPE_TYPES = keyof typeof RAW_MATERIAL_CATEGORY_TYPE;



export const FACTORY = {
  FACTORY705: "FACTORY705",
  FACTORY708: "FACTORY708"
} as const


export type FACTORY_TYPES = keyof typeof FACTORY;


export const RAW_MATERIAL_REQUEST={
  APPROVED:"APPROVED",
  REJECTED:"REJECTED",
  PENDING:"PENDING"
}
export type RAW_MATERIAL_REQUEST_TYPES=keyof typeof RAW_MATERIAL_REQUEST;
