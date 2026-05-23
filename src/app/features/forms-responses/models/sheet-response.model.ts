export interface SheetApiResponse {
  data: ContentItem[];
  success: boolean;
}

export interface ContentItem {
  createTime: string;
  userName: string;
  imgUrl: string;
  content: string;
}
