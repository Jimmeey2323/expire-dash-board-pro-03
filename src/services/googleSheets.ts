interface GoogleOAuthConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REFRESH_TOKEN: string;
  TOKEN_URL: string;
}

class GoogleSheetsService {
  private config: GoogleOAuthConfig = {
    CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
    CLIENT_SECRET: "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",
    REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
    TOKEN_URL: "https://oauth2.googleapis.com/token"
  };

  private spreadsheetId = "1rGMDDvvTbZfNg1dueWtRN3LhOgGQOdLg3Fd7Sn1GCZo";
  private sheetName = "Expirations";
  private annotationsSheetName = "Member_Annotations";

  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(this.config.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.CLIENT_ID,
          client_secret: this.config.CLIENT_SECRET,
          refresh_token: this.config.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async fetchSheetData(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:P`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async fetchAnnotations(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:I`; // Extended to include unique ID
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // If sheet doesn't exist, create it
        await this.createAnnotationsSheet();
        return [['Unique ID', 'Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Note Date', 'Last Updated', 'Persistence Key']];
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching annotations:', error);
      return [['Unique ID', 'Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Note Date', 'Last Updated', 'Persistence Key']];
    }
  }

  async createAnnotationsSheet(): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: this.annotationsSheetName
                }
              }
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create annotations sheet');
      }

      // Add headers with unique ID as primary key
      await this.updateAnnotations([
        ['Unique ID', 'Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Note Date', 'Last Updated', 'Persistence Key']
      ]);
    } catch (error) {
      console.error('Error creating annotations sheet:', error);
    }
  }

  async updateAnnotations(values: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:I`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update annotations');
      }
    } catch (error) {
      console.error('Error updating annotations:', error);
      throw error;
    }
  }

  async saveAnnotation(uniqueId: string, memberId: string, email: string, comments: string, notes: string, tags: string[], noteDate: string): Promise<void> {
    try {
      const annotationsData = await this.fetchAnnotations();
      
      // Use unique ID from column A as primary key for enhanced persistence
      const existingIndex = annotationsData.findIndex(row => row[0] === uniqueId);
      
      const timestamp = new Date().toISOString();
      const tagsString = tags.join(', ');
      // Enhanced persistence key with multiple fallback identifiers
      const persistenceKey = `${uniqueId}-${memberId}-${email.toLowerCase()}`;
      
      const newRow = [
        uniqueId,      // Column A unique ID (primary key)
        memberId,      // Member ID
        email,         // Email
        comments,      // Comments
        notes,         // Notes
        tagsString,    // Tags
        noteDate,      // Note Date
        timestamp,     // Last Updated
        persistenceKey // Persistence Key
      ];
      
      if (existingIndex >= 0) {
        // Update existing row
        annotationsData[existingIndex] = newRow;
      } else {
        // Add new row
        annotationsData.push(newRow);
      }
      
      await this.updateAnnotations(annotationsData);
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  private formatDate(dateString: string): string {
    if (!dateString || dateString === '-' || dateString === '') return '';
    
    try {
      // Handle various date formats
      let date: Date;
      
      // Check if it's already a valid date string
      if (dateString.includes('/')) {
        // Format: MM/DD/YYYY HH:mm:ss or DD/MM/YYYY
        const parts = dateString.split(' ')[0].split('/');
        if (parts.length === 3) {
          // Assume MM/DD/YYYY format from Google Sheets
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else {
          date = new Date(dateString);
        }
      } else if (dateString.includes('-')) {
        // ISO format or YYYY-MM-DD
        date = new Date(dateString);
      } else {
        // Try parsing as-is
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${dateString}`);
        return dateString; // Return original if can't parse
      }
      
      return date.toISOString();
    } catch (error) {
      console.warn(`Error parsing date: ${dateString}`, error);
      return dateString; // Return original if error
    }
  }

  async getMembershipData() {
  try {
    const [rawData, annotationsData] = await Promise.all([
      this.fetchSheetData(),
      this.fetchAnnotations()
    ]);

    if (rawData.length === 0) return [];

    const [headers, ...rows] = rawData;
    const [annotationHeaders, ...annotationRows] = annotationsData;

    // Enhanced annotation mapping with multiple fallback strategies
    const annotationsMap = new Map();
    annotationRows.forEach(row => {
      if (row[0]) { // if unique ID exists (column A)
        const uniqueId = row[0];
        const annotation = {
          comments: row[3] || '',
          notes: row[4] || '',
          tags: row[5] ? row[5].split(', ').filter(tag => tag.trim()) : [],
          noteDate: row[6] || ''
        };

        // Primary storage by unique ID with enhanced persistence
        annotationsMap.set(uniqueId, annotation);

        // Additional fallback mappings for data integrity
        const memberId = row[1];
        const email = row[2];
        if (memberId && email) {
          const fallbackKey = `${memberId}-${email.toLowerCase()}`;
          annotationsMap.set(fallbackKey, annotation);
        }
      }
    });

    return rows.map(row => {
      const uniqueId = row[0] || ''; // Column A unique ID
      const memberId = row[1] || '';
      const email = row[4] || '';
      const firstName = row[2] || '';
      const lastName = row[3] || '';

      // ✅ Fixed: Properly assign the result to a variable
      const annotations =
        annotationsMap.get(uniqueId) ||
        annotationsMap.get(`${memberId}-${email.toLowerCase()}`) || {
          comments: '',
          notes: '',
          tags: [],
          noteDate: ''
        };

      const persistenceKey = `${uniqueId}-${memberId}-${email}`.toLowerCase();
      const uniqueIdentifier = `${memberId}-${email}-${firstName}-${lastName}`.toLowerCase();

      return {
        uniqueId,
        memberId,
        firstName,
        lastName,
        email,
        membershipName: row[5] || '',
        endDate: this.formatDate(row[6]) || '',
        location: row[7] || '',
        sessionsLeft: parseInt(row[8]) || 0,
        itemId: row[9] || '',
        orderDate: this.formatDate(row[10]) || '',
        soldBy: row[11] || '',
        membershipId: row[12] || '',
        frozen: row[13] || '',
        paid: row[14] || '',
        status: row[15] as 'Active' | 'Expired' || 'Expired',
        comments: annotations.comments,
        notes: annotations.notes,
        tags: annotations.tags,
        noteDate: annotations.noteDate,
        startDate: this.formatDate(row[10]) || '',
        totalSessions: this.calculateTotalSessions(row[8], row[16]) || parseInt(row[8]) || 0,
        phone: row[17] || row[16] || '',
        address: row[18] || row[17] || '',
        persistenceKey,
        uniqueIdentifier,
        dataSource: 'google_sheets',
        lastSync: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Error processing membership data:', error);
    return this.getMockData();
  }
}
  
  private calculateTotalSessions(sessionsLeft: string, totalSessionsCol?: string): number {
    // Try to get total sessions from dedicated column first
    if (totalSessionsCol && !isNaN(parseInt(totalSessionsCol))) {
      return parseInt(totalSessionsCol);
    }
    
    // Fallback to sessions left if no total sessions column
    const sessions = parseInt(sessionsLeft) || 0;
    
    // If sessions left is available, estimate total based on common patterns
    if (sessions > 0) {
      // Common membership packages: 4, 8, 12, 20, unlimited (represented as high number)
      if (sessions <= 4) return Math.max(sessions, 4);
      if (sessions <= 8) return Math.max(sessions, 8);
      if (sessions <= 12) return Math.max(sessions, 12);
      if (sessions <= 20) return Math.max(sessions, 20);
      return sessions; // For unlimited or custom packages
    }
    
    return sessions;
  }

  private getMockData() {
    return [
      {
        uniqueId: "4406-Studio 4 Class Package-19981880-2022-02-27T18:30:00.000Z",
        memberId: "4406",
        firstName: "Shereena",
        lastName: "Master",
        email: "shereena.master@gmail.com",
        membershipName: "Studio 4 Class Package",
        endDate: "11/02/2023 00:00:00",
        location: "Kwality House, Kemps Corner",
        sessionsLeft: 0,
        itemId: "19981880",
        orderDate: "2022-02-28 00:00:00",
        soldBy: "-",
        membershipId: "25768",
        frozen: "-",
        paid: "4779",
        status: "Expired" as const,
        comments: "",
        notes: "",
        tags: [],
        noteDate: "",
        persistenceKey: "4406-studio 4 class package-19981880-2022-02-27t18:30:00.000z-4406-shereena.master@gmail.com",
        uniqueIdentifier: "4406-shereena.master@gmail.com-shereena-master"
      },
      {
        uniqueId: "77316-Studio Annual Unlimited---2026-01-01T00:12:39.000Z",
        memberId: "77316",
        firstName: "Ayesha",
        lastName: "Mansukhani",
        email: "ayesha.mansukhani@gmail.com",
        membershipName: "Studio Annual Unlimited",
        endDate: "01/01/2026 05:42:39",
        location: "Kwality House, Kemps Corner",
        sessionsLeft: 0,
        itemId: "-",
        orderDate: "2026-01-01 05:42:39",
        soldBy: "-",
        membershipId: "-",
        frozen: "FALSE",
        paid: "-",
        status: "Active" as const,
        comments: "",
        notes: "",
        tags: [],
        noteDate: "",
        persistenceKey: "77316-studio annual unlimited---2026-01-01t00:12:39.000z-77316-ayesha.mansukhani@gmail.com",
        uniqueIdentifier: "77316-ayesha.mansukhani@gmail.com-ayesha-mansukhani"
      },
      {
        uniqueId: "110567-Studio 4 Class Package-39727200-2025-04-12T13:27:43.839Z",
        memberId: "110567",
        firstName: "Swathi",
        lastName: "Mohan",
        email: "swathimohan05@gmail.com",
        membershipName: "Studio 4 Class Package",
        endDate: "25/04/2025 19:30:00",
        location: "Supreme HQ, Bandra",
        sessionsLeft: 3,
        itemId: "39727200",
        orderDate: "2025-04-12 18:57:43",
        soldBy: "imran@physique57mumbai.com",
        membershipId: "25768",
        frozen: "-",
        paid: "6313",
        status: "Expired" as const,
        comments: "",
        notes: "",
        tags: [],
        noteDate: "",
        persistenceKey: "110567-studio 4 class package-39727200-2025-04-12t13:27:43.839z-110567-swathimohan05@gmail.com",
        uniqueIdentifier: "110567-swathimohan05@gmail.com-swathi-mohan"
      }
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();