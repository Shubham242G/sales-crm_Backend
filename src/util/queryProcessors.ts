export const paginationProcessor = (
    query: any,
    pageSizeKey: string = "pageSize",
    pageIndexKey: string = "pageIndex",
  ) => {
    let pageSize = parseInt(query[pageSizeKey]);
    let pageIndex = parseInt(query[pageIndexKey]);
  
    if (isNaN(pageSize)) {
      pageSize = 100;
    }
  
    if (isNaN(pageIndex)) {
      pageIndex = 1;
    }
  
    return {
      pageIndex:pageIndex-1,
      pageSize,
      skip: (pageIndex -1)* pageSize,
    };
  };