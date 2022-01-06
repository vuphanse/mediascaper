
# A simple web app to demonstrate how to scrape images and videos from an url with cherio (nodejs)

## Prequisites
- NodeJS installed
- MongoDB installed
- `yarn` installed

## How to run? 

- Checkout this repository
- Run `npm install && yarn dev` command to test from http://localhost:3000

## Disclaimer 

This is built in only a few hours to demonstrate the ability to write a simple app with NodeJS & React for skill testing purpose. No warranty to fully serve as a real application.


### This app structure is forked from https://github.com/fractalliter/express-react-typescript

### Notes: There are few issues needed to be resolved to improve the usability of this project

- Get images/videos attached in iframes?
- Images from background-url style of element instead of <img> tag
- Store actual media files once found instead of raw src url
- Get images/videos from virtual DOM tags instead of html5 tags
- Fix getting video src declared as blob: