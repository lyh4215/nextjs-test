"use client";

import {useSelector, useDispatch} from "react-redux";
import {increment, decrement } from "@/store/counterSlice";
import type {RootState} from "@/store/store";

import { useTheme } from "@/app/providers/theme-context";



export default function Contact() {
    const value = useSelector((state: RootState) => state.counter.value);
    const dispatch = useDispatch();

    const {dark, toggleDark} = useTheme();

    return (
        <div className = "bg-black min-h-screen text-white flex items-center justify-center gap-5">
            Contact
            <p className="text-2xl">{value}</p>
            <button onClick={() => dispatch(increment())}>+</button>
            <button onClick={() => dispatch(decrement())}>-</button>
            <div
            style={{
                minHeight: "100vh",
                background: dark ? "#111" : "#fff",
                color: dark ? "#fff" : "#000",
            }}
            >
                <button onClick={toggleDark}>Toggle Theme</button>
            </div>
        </div>
    );
}