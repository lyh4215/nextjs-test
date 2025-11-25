"use client";

import {useSelector, useDispatch} from "react-redux";
import {increment, decrement } from "@/store/counterSlice";
import type {RootState} from "@/store/store";



export default function Contact() {
    const value = useSelector((state: RootState) => state.counter.value);
    const dispatch = useDispatch();
    return (
        <div className = "bg-black min-h-screen text-white flex items-center justify-center gap-5">
            Contact
            <p className="text-2xl">{value}</p>
            <button onClick={() => dispatch(increment())}>+</button>
            <button onClick={() => dispatch(decrement())}>-</button>
        </div>
    );
}