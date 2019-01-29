
export type ContentEntryStatus = 'published' | 'unpublished' | 'deleted';

export interface ContentEntry {
    id: string; // Document id
    contentType: string;
    data: { [key: string]: any }; // The content data to render into templates
    title: string;  // Presentation title for browser window title and content listings
    url: {
        root: string, // The entry path root
        path: string, // The entry URL
    };
    revision: number; // Constantly increasing
    status: ContentEntryStatus;
    tags: string[];
    standalone: boolean;
    publishTime?: any; // firebase.firestore.Timestamp | firebase.firestore.FieldValue;
    updatedAt: any; // firebase.firestore.Timestamp | firebase.firestore.FieldValue;
    createdAt: any; // firebase.firestore.Timestamp | firebase.firestore.FieldValue;
}