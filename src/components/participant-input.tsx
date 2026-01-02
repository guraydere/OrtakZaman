"use client";

import { useState, KeyboardEvent } from "react";
import { X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ParticipantInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function ParticipantInput({
    value,
    onChange,
    placeholder = "İsim yazın ve Enter'a basın...",
    className,
}: ParticipantInputProps) {
    const [inputValue, setInputValue] = useState("");

    const addParticipant = (name: string) => {
        const trimmed = name.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInputValue("");
    };

    const removeParticipant = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addParticipant(inputValue);
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeParticipant(value.length - 1);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Input area */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="h-11 sm:h-12 pl-10 text-sm sm:text-base bg-white dark:bg-background border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl"
                    />
                </div>
                {inputValue && (
                    <button
                        type="button"
                        onClick={() => addParticipant(inputValue)}
                        className="h-11 sm:h-12 px-4 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all"
                    >
                        Ekle
                    </button>
                )}
            </div>

            {/* Participant chips */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {value.map((name, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm font-medium border border-blue-200 dark:border-blue-700"
                        >
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold">
                                {name.charAt(0).toUpperCase()}
                            </span>
                            {name}
                            <button
                                type="button"
                                onClick={() => removeParticipant(index)}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-200 dark:bg-blue-700 hover:bg-red-200 dark:hover:bg-red-700 flex items-center justify-center transition-colors active:scale-90"
                            >
                                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Counter */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    {value.length === 0
                        ? "Henüz katılımcı eklenmedi"
                        : `${value.length} katılımcı eklendi`}
                </span>
                {value.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange([])}
                        className="text-red-500 hover:text-red-600 font-medium"
                    >
                        Hepsini sil
                    </button>
                )}
            </div>
        </div>
    );
}
