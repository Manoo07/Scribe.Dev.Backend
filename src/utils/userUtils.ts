export function generateUsername(username: string | undefined, firstName: string, lastName: string): string {
    if (username?.trim()) {
      return username.trim();
    }
  
    if (firstName && lastName) {
      const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const formattedLastInitial = lastName.charAt(0).toUpperCase();
      return `${formattedFirstName} ${formattedLastInitial}`;
    }
  
    return '';
  }