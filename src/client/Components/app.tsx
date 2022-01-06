import * as React from 'react';
import '../Less/app.less';
import {apiRoute} from '../utils';
import {AppProps, AppStates, MediaProps, MediaState } from "../../server/domain/IApp";
import {Post, Get} from "../Services";
import _ from "underscore";
import { IScrapeData } from '../../server/domain/IScrapeData';

const numItemsPerPage = 3;

export default class App extends React.Component<AppProps, AppStates> {
    state: AppStates = {
        urlsText: "",
        scrapingResult: undefined,
        isLoading: false,
        isScraping: false,

        pageIndex: 0,
        searchText: "",
        types: ["image", "video"],
        results: [],
        count: 0,
    };

    componentDidMount = () => {
        this.get();
    }

    scrape = async (): Promise<void> => {
        const { urlsText } = this.state;
        if (!urlsText?.trim())
            return;

        this.setState({ isScraping: true });
        const urls = urlsText.split(";");

        try {
            const data: any = await Post(apiRoute.getRoute("scrape"), { urls });
            this.setState({ scrapingResult: data });
        } catch (e) {
            this.setState({ errorMessage: e.message });
        } finally {
            this.setState({ isScraping: false });
        }
    }

    get = async (): Promise<any[]> => {
        try {
            this.setState({ isLoading: true });
            let route = `${apiRoute.getRoute("scrape")}?`;
            route += new URLSearchParams({
                searchText: this.state.searchText.toString(),
                pageIndex: this.state.pageIndex.toString(),
            }).toString();

            const data: { results: IScrapeData[], count: number } = await Get(route);
            this.setState({ results: data.results, count: data.count });

        } catch (e) {
            this.setState({ errorMessage: e.message });
        } finally {
            this.setState({ isLoading: false });
        }

        return [];
    }

    next = async (): Promise<void> => {
        let numOfPages = Math.ceil(this.state.count / numItemsPerPage);
        if (this.state.pageIndex + 1 >= numOfPages)
            return;

        let index = this.state.pageIndex + 1;
        this.setState({ pageIndex: index }, this.get);
    }

    previous = async (): Promise<void> => {
        if (this.state.pageIndex > 0)
            this.setState({ pageIndex: this.state.pageIndex - 1 }, this.get);
    }

    toggleTypes = (type: string) => {
        let index = this.state.types.indexOf(type);
        if (index >= 0)
            this.state.types.splice(index, 1);
        else
            this.state.types.push(type);

        this.setState({ types: this.state.types });
    }

    render() {
        const { isLoading, isScraping, scrapingResult, errorMessage } = this.state;
        const urlInputPlaceholder = "Enter some urls to scrape (separated by semicolon)";
        const searchInputPlaceholder = "Filter by text";

        let self = this;
        const updateText = _.debounce(function(text: string): void {
            self.setState({ searchText: text });
        }, 300);

        return (
            <div>
                <div className="scrape-section">
                    <h1> Scraping </h1> 
                    <input className="url-input" type="text" onChange={e => this.setState({urlsText: e.target.value})} placeholder={urlInputPlaceholder}/>
                    <button onClick={this.scrape}>{"Happy scraping!"}</button>

                    <div>
                    {
                        isScraping 
                        ? <><label>{"Scraping...Please wait! "}</label></>
                        : scrapingResult && <><pre className="results-code">{JSON.stringify(scrapingResult, null, 4)}</pre></>
                    }
                    </div>

                    {
                        errorMessage && <div className="error-message">{errorMessage}</div>
                    }
                </div>

                <div className="results-section">
                    <h1> Viewing</h1>
                    <input className="url-input" type="text" onChange={e => updateText(e.target.value)} placeholder={searchInputPlaceholder}/>
                    <button onClick={e => this.setState({ pageIndex: 0 }, this.get)}>{"Filter"}</button>

                    <div className="toolbar">
                        <h6>Displaying page {this.state.pageIndex + 1} of { Math.ceil(this.state.count / numItemsPerPage)} pages</h6>
                        <div className="checkboxes">
                            <div className="checkbox">
                                <input type="checkbox" value="video" checked={this.state.types.indexOf("video") >= 0 } onChange={e => this.toggleTypes("video")}/> Video
                            </div>
                            <div className="checkbox">
                                <input type="checkbox" value="image" checked={this.state.types.indexOf("image") >= 0 } onChange={e => this.toggleTypes("image")}/> Image
                            </div>
                        </div>

                        <div className="navigation">
                            <button onClick={this.previous}>{"Previous"}</button>
                            <button onClick={this.next}>{"Next"}</button>
                        </div>
                    </div>

                    <div>
                        {
                            isLoading ?
                            <h3>Loading...</h3>
                            : <div>
                                {
                                    this.state.results.map(function(result: IScrapeData): any {
                                        let medias = [];
                                        if (self.state.types.indexOf("image") >= 0) {
                                            result.images.forEach(function(imageSrc: string): void {
                                                medias.push(<Media key={imageSrc} type="image" src={imageSrc}></Media>);
                                            });
                                        }
        
                                        if (self.state.types.indexOf("video") >= 0) {
                                            result.videos.forEach(function(videoSrc: string): void {
                                                medias.push(<Media key={videoSrc} type="video" src={videoSrc}></Media>);
                                            });
                                        }
     
                                        return (
                                            <div>
                                                <h4>{result.url}</h4>
                                                <div className="media-section">
                                                    {
                                                        medias.length > 0 
                                                        ?
                                                        medias
                                                        : <h5>No media to view!</h5>
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

class Media extends React.Component<MediaProps, MediaState> {
    render() {
        return (
            <div className="media">
                { this.props.type == "image" 
                    ? <img key={this.props.src} src={this.props.src} className="img"/>
                    : <video key={this.props.src} className="video" controls>
                        <source src={this.props.src} type="video/mp4"></source>
                    </video>
                }
            </div>
        );
    }
}
