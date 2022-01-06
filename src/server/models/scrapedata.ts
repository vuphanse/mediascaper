import { IScrapeData } from "../domain/IScrapeData";
import Database from "../dbConfigs";
import { Schema } from "mongoose";

const {mongo: {model}} = Database;

const scrapeDataSchema: Schema<IScrapeData> = new Schema<IScrapeData>({
    videos: [String],
    images: [String],
    scrapedAt: Date,
    url: String,
});

export default model<IScrapeData>("scrapedata", scrapeDataSchema);