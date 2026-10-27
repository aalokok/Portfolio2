// Minimal types for the parts of page-flip (StPageFlip) this site uses.
// The package ships TypeScript sources but no compiled declarations.
declare module "page-flip" {
  export type FlipSetting = {
    startPage: number;
    size: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  };

  export type PageFlipEvent<T = unknown> = { data: T; object: PageFlip };

  export class PageFlip {
    constructor(root: HTMLElement, settings: Partial<FlipSetting>);
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    destroy(): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on<T = unknown>(event: "init" | "update" | "flip" | "changeOrientation" | "changeState", cb: (e: PageFlipEvent<T>) => void): this;
    off(event: string): void;
  }
}
