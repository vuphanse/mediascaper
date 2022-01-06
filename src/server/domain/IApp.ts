import { IScrapeData } from "../../server/domain/IScrapeData";

export interface AppStates {
    isScraping?: boolean;
    isLoading?: boolean;
    urlsText?: string;
    scrapingResult?: IScrapeData[];
    errorMessage?: string;

    searchText?: string;
    types?: string[];
    pageIndex?: number;
    results: IScrapeData[];
    count: number;
}

export interface AppProps {}

export interface MediaProps {
    src: string;
    type: "image" | "video";
    key: string;
}

export interface MediaState {}
