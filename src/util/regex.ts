export function matchIgnoringSpacesRegex(str1: string, str2: string): boolean {
       // Normalize by removing spaces and converting different hyphens to a standard hyphen
       const normalize = (str: string) =>
        str.replace(/[-–—]/g, '-') // Replace all hyphen types with a standard hyphen
           .replace(/\s+/g, '');   // Remove all spaces

    // Normalize both strings
    const normalizedStr1 = normalize(str1);
    const normalizedStr2 = normalize(str2);

    // Compare the normalized strings
    return normalizedStr1 === normalizedStr2;
}
