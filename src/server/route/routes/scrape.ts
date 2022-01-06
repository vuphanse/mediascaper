import router from '../router';
import {Request, Response, NextFunction} from "express";
import {ScrapeData} from '../../models';
import { APIError } from '../../domain/IError';
import request from "request";
import { URL } from "url";
import _ from "underscore";
import { IScrapeData } from '../../domain/IScrapeData';

const cherio = require("cherio");
const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
const numItemsPerPage = 3;

function validateUrl(url: string): boolean {
    return urlRegex.test(url);
}

async function verifyUrl(url: string): Promise<boolean> {
    return new Promise(function(resolve, reject): void {
        request.get(url, function(error: any, response: any): void {
            if (error || response.statusCode != 200)
                resolve(false);
            else
                resolve(true);
        });
    });
}

async function getItemUrl(baseUrl: string, path: string): Promise<string> {
    if (path.indexOf("data:") == 0) // base64 src
        return path;

    if (path.indexOf("http://") == 0 || path.indexOf("https://") == 0) // actual url
        return path;

    // some websites have image src url as path of their respective public static access
    // in that case we need to construc the url & verify its accessibility
    let url = new URL(baseUrl);
    let host = url.host;
    let pathName = url.pathname;
    let protocol = url.protocol;
    let trynumber = 0;

    let expectedUrl = path.startsWith("/") ? `${protocol}//${host}${path}` : `${protocol}//${host}/${path}`;
    let accessible = await verifyUrl(`${protocol}//${host}/${path}`);

    while ((!accessible || pathName.indexOf("/") > 0) && trynumber < 10) {
        trynumber++;
        let lastSlashIndex = pathName.lastIndexOf("/");
        pathName = pathName.substr(0, lastSlashIndex);
        expectedUrl = `${protocol}//${host}/${pathName}${path.startsWith("/") ? path : "/" + path}`;
        accessible = await verifyUrl(expectedUrl);
    }
    
    if (accessible)
        return expectedUrl;
    
    return "";
}

function getItemSource(item: any): string {
    let attrs = item.attr();
    if (!attrs)
        return "";

    if (attrs["data-src"])
        return attrs["data-src"];

    return attrs["src"];
}

interface ScrapingResult {
    videos: string[];
    images: string[];
    url: string;
}

async function scrapeImagesAndVideos(pageUrl: string): Promise<ScrapingResult | null> {
    let isValid = validateUrl(pageUrl);
    if (!isValid) {
        console.log(`Skip scraping ${pageUrl} url as it is not a valid one`);
        return null;
    }

    return new Promise(function(resolve, reject): void {
        request.get(pageUrl, async function(error: any, response: any, html: string): Promise<void> {
            if (error) {
                console.log("Failed to get url: ", pageUrl, error);
                return reject(error);
            }

            let $ = cherio.load(html);
            let promises: any[] = [];
            $("img").each(function(this: any, index: number, img: any): void {
                promises.push(getItemUrl(pageUrl, getItemSource($(this))));
            });

            let images = _.uniq(await Promise.all(promises));

            promises = [];
            $("video source").each(function(this: any, index: number, video: any): void {
                promises.push(getItemUrl(pageUrl, getItemSource($(this))));
            });

            let videos = _.uniq(await Promise.all(promises));
            resolve({ images, videos, url: pageUrl });
        });
    });
}

router.route('/scrape')
    .get(async function(req: Request, res: Response, next: NextFunction): Promise<void> {
        let searchText = req.query.searchText as string;
        let pageIndex = +req.query.pageIndex as number;

        try {
            if (isNaN(pageIndex))
                pageIndex = 0;

            let baseQuery: any = {};

            if (searchText.trim()) {
                let regex = new RegExp(escape(searchText), "ig");
                baseQuery.$or = [{
                    url: { $regex: regex },
                }, {
                    videos: { $elemMatch: { $regex: regex } },
                }, {
                    images: { $elemMatch: { $regex: regex } },
                }];
            }

            let results = await ScrapeData.find(baseQuery, {}, {
                skip: pageIndex * numItemsPerPage,
                limit: numItemsPerPage,
            });
            let count = await ScrapeData.find(baseQuery).count();
            
            res.status(201).json({ results, count });
        } catch (e) {
            return next(new APIError(500, "An error happened"));
        }
    })
    .post(async function(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (!req.body.urls?.length)
            return next(new APIError(403, "No url to scrape"));

        let data: ScrapingResult[] = [];
        try {
            for (let url of req.body.urls) {
                let result = await scrapeImagesAndVideos(url);
                if (result) {
                    if (await ScrapeData.exists({ url: url })) {
                        await ScrapeData.updateOne({ url }, {
                            url,
                            videos: result.videos,
                            images: result.images,
                        });
                    } else {
                        const scrapeData: IScrapeData = new ScrapeData({
                            url,
                            videos: result.videos,
                            images: result.images,
                            scrapedAt: new Date(),
                        });
    
                        await scrapeData.save();
                    }

                    data.push(result);
                }
            }
        } catch (e) {
            return next(new APIError(500, "An error happened"));
        }

        res.status(201).json(data);
    });


export default router;