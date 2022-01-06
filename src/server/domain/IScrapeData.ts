import { Document } from "mongoose";

export interface IScrapeData extends Document {
    url: string;
    scrapedAt: Date;
    images: string[];
    videos: string[];
}
