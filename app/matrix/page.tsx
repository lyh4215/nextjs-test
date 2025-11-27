"use client";
import * as BlockTypes from "@/lib/blocks/blocks.types"

type Root = {
    columnHead : BlockTypes.ColumnBlock;
    rowHead : BlockTypes.RowBlock;
}


export default function Page() {
    
    return (
        <div>
            Block!
        </div>
    )
}