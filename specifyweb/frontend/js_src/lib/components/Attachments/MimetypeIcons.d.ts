// Support importing SVG files as strings

declare module '*.svg' {

    const content: string;
  
    export default content;
}  