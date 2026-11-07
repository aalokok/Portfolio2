import { blockTypes } from "./blocks";
import { inspirationBoardType } from "./inspiration";
import { projectType } from "./project";

export const schemaTypes = [projectType, inspirationBoardType, ...blockTypes];
