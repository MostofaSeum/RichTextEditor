'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
// @ts-expect-error: Mammoth browser entrypoint lacks TypeScript declaration file
import * as mammoth from 'mammoth/mammoth.browser';
import {
    Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
    AlignJustify, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Scissors, Undo, Redo, ChevronDown, Minus, Superscript, Subscript,
    Code, Quote, Palette, Highlighter, Outdent, Indent, Table, Plus,
    Copy, Eraser, Type, Languages, Maximize, Minimize, ArrowUpDown, MousePointer2,
    Grid, Search, Mic, Smile, FileText, Brush, Shapes, FileUp, Upload, X
} from 'lucide-react';

// ─── Context ──────────────────────────────────────────────────────────────────

const DropdownContext = React.createContext<{ close: () => void } | null>(null);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RichTextEditorProps {
    /** HTML string value */
    value: string;
    /** Called with HTML string on every change */
    onChange: (html: string) => void;
    placeholder?: string;
    /** Minimum height of the editing area in px */
    minHeight?: number;
    className?: string;
    /**
     * Optional custom image uploader for S3, Cloudinary, Firebase, or custom backend.
     * Receives the File and should return the uploaded public image URL.
     * If omitted, images are automatically converted to Base64 data URLs.
     */
    onUploadImage?: (file: File) => Promise<string> | string;
    /**
     * callback; the caller should invoke the callback with the chosen image URL.
     */
    onInsertImageClick?: (callback: (url: string) => void) => void;
    /**
     * Optional handler to open a file picker externally.
     * Callback args: (url: string, fileName?: string)
     */
    onInsertFileClick?: (callback: (url: string, name?: string) => void) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = ['Default', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'];
const SIZES = ['8', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const HEADINGS = [
    { label: 'Paragraph', tag: 'p' },
    { label: 'Heading 1', tag: 'h1' },
    { label: 'Heading 2', tag: 'h2' },
    { label: 'Heading 3', tag: 'h3' },
    { label: 'Heading 4', tag: 'h4' },
    { label: 'Heading 5', tag: 'h5' },
    { label: 'Heading 6', tag: 'h6' },
];
const TEXT_COLORS = [
    '#0f172a', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
    '#64748b', '#ffffff',
];
const HIGHLIGHT_COLORS = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca',
    '#e9d5ff', '#fed7aa', '#cffafe', 'transparent',
];

const WORDART_PRESETS = [
    { name: 'Neon Blue', shadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #1d4ed8', color: '#eff6ff' },
    { name: 'Gold Gloss', shadow: '1px 1px 0px #b45309, 2px 2px 0px #92400e, 3px 3px 5px rgba(0,0,0,0.4)', color: '#fbbf24' },
    { name: 'Retro 3D Red', shadow: '1px 1px 0px #dc2626, 2px 2px 0px #b91c1c, 3px 3px 0px #991b1b, 4px 4px 4px rgba(0,0,0,0.5)', color: '#fecaca' },
    { name: 'Emerald Glow', shadow: '0 0 8px rgba(16, 185, 129, 0.8)', color: '#047857' },
    { name: 'Metallic Silver', shadow: '0 1px 1px #ffffff, 0 -1px 1px #475569', color: '#cbd5e1' },
    { name: 'Shadow Outline', shadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 5px rgba(0,0,0,0.3)', color: '#ffffff' }
];

// ─── Tiny sub-components ──────────────────────────────────────────────────────

function Divider() {
    return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
}

function ToolBtn({
    onClick, title, children, className = '', active = false
}: { onClick: () => void; title: string; children: React.ReactNode; className?: string; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            className={`p-1.5 rounded transition-colors h-7 w-7 flex items-center justify-center text-slate-700 ${active ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'hover:bg-gray-100'
                } ${className}`}
        >
            {children}
        </button>
    );
}

function ToolDropdown({
    label, children, minW = 140, align = 'left',
}: { label: React.ReactNode; children: React.ReactNode; minW?: number; align?: 'left' | 'right' }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 border border-gray-200 bg-white text-xs font-semibold text-slate-700 h-7 whitespace-nowrap"
            >
                {label}
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {open && (
                <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
                    <div
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-0.5 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-y-auto`}
                        style={{ minWidth: minW, maxHeight: 240 }}
                    >
                        {children}
                    </div>
                </DropdownContext.Provider>
            )}
        </div>
    );
}

function DropItem({ onClick, children, className = '' }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
    const ctx = React.useContext(DropdownContext);
    return (
        <button
            type="button"
            onMouseDown={e => {
                e.preventDefault();
                onClick?.();
                ctx?.close();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 text-slate-700 transition-colors ${className}`}
        >
            {children}
        </button>
    );
}

// ─── Table Picker (MS-Word style grid selector) ───────────────────────────────

const TABLE_MAX = 8; // max 8×8 grid

function TablePickerBtn({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const label = hovered ? `${hovered.row} × ${hovered.col}` : 'Table';

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                title="Insert Table"
                onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
                className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-100 text-slate-700 h-7 transition-colors"
            >
                <Table className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 select-none"
                    style={{ minWidth: 220 }}
                >
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">
                        {label}
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {Array.from({ length: TABLE_MAX }, (_, rowIdx) => (
                            <div key={rowIdx} className="flex gap-0.5">
                                {Array.from({ length: TABLE_MAX }, (_, colIdx) => {
                                    const r = rowIdx + 1;
                                    const c = colIdx + 1;
                                    const isActive = hovered && r <= hovered.row && c <= hovered.col;
                                    return (
                                        <div
                                            key={colIdx}
                                            onMouseEnter={() => setHovered({ row: r, col: c })}
                                            onMouseLeave={() => setHovered(null)}
                                            onMouseDown={e => {
                                                e.preventDefault();
                                                onInsert(r, c);
                                                setOpen(false);
                                                setHovered(null);
                                            }}
                                            className={`w-6 h-6 border rounded cursor-pointer transition-all duration-75 ${isActive
                                                    ? 'bg-primary-base/20 border-primary-base'
                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">Click to insert table</p>
                </div>
            )}
        </div>
    );
}

// ─── Horizontal Rule Designer ────────────────────────────────────────────────
function CustomHrBtn({ onInsert }: { onInsert: (style: string, size: string, color: string) => void }) {
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState('solid');
    const [size, setSize] = useState('2px');
    const [color, setColor] = useState('#cbd5e1');
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                title="Design Custom Horizontal Line"
                onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
                className={`p-1.5 rounded transition-colors h-7 w-7 flex items-center justify-center text-slate-700 hover:bg-gray-100 ${open ? 'bg-gray-100' : ''}`}
            >
                <Minus className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3"
                    style={{ minWidth: 260 }}
                >
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Divider Designer
                    </p>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">Line Style</label>
                        <select
                            value={style}
                            onChange={e => setStyle(e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1 outline-none font-semibold text-gray-700 bg-white"
                        >
                            <option value="solid">─ Solid</option>
                            <option value="dashed">╌ Dashed</option>
                            <option value="dotted">… Dotted</option>
                            <option value="double">═ Double</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">Thickness</label>
                        <select
                            value={size}
                            onChange={e => setSize(e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1 outline-none font-semibold text-gray-700 bg-white"
                        >
                            <option value="1px">1px Thin</option>
                            <option value="2px">2px Standard</option>
                            <option value="4px">4px Thick</option>
                            <option value="6px">6px Extra Thick</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">Color</label>
                        <div className="flex items-center gap-2">
                            {['#cbd5e1', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full border transition-transform ${color === c ? 'scale-125 border-indigo-600' : 'border-gray-200 hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-6 h-6 border-none cursor-pointer p-0"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onInsert(style, size, color);
                            setOpen(false);
                        }}
                        className="w-full text-center py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                        Insert Custom Divider
                    </button>
                </div>
            )}
        </div>
    );
}

const TEMPLATES = [
    {
        name: '🎨 Premium "Bellows College" Grid Newsletter Layout',
        html: `
            <div class="word-imported-content" style="max-width: 850px; margin: 20px auto; padding: 16px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); box-sizing: border-box;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 16px; background-color: transparent; font-family: 'Arial', sans-serif;">
                    <tr>
                        <td style="width: 33%; background-color: #8e9ca3; padding: 24px; color: #ffffff; border-radius: 12px; vertical-align: top; box-sizing: border-box;">
                            <div style="font-size: 20px; font-weight: 800; border-left: 4px solid #00adef; padding-left: 8px; margin-bottom: 12px; letter-spacing: 1px;">BELLOWS COLLEGE</div>
                            <div style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #ffffff; letter-spacing: 2px;">NEWSLETTER</div>
                            <div style="font-size: 12px; color: #e2e8f0; margin-top: 4px;">Volume #</div>
                        </td>
                        <td style="width: 33%; padding: 0; vertical-align: top; border-radius: 12px; overflow: hidden; background-color: #e2e8f0; height: 160px; box-sizing: border-box;">
                            <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60" style="width: 100%; height: 160px; object-fit: cover; display: block; filter: grayscale(100%);" alt="College Campus"/>
                        </td>
                        <td rowspan="2" style="width: 33%; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px; color: #ffffff; border-radius: 12px; vertical-align: top; box-sizing: border-box;">
                            <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; border-bottom: 2px solid rgba(255,255,255,0.4); padding-bottom: 8px; margin-bottom: 16px;">WELCOME</div>
                            <p style="font-size: 12px; line-height: 1.65; color: rgba(255,255,255,0.95); margin-bottom: 12px; text-align: justify; font-family: 'Arial', sans-serif;">
                               Ur res qui volorrori ommodis arum il ma sunt am harupta tectotat quos rehentempos reperelem vello ditis as ea dio sae core as nobis arum eatemol uptaspici con consed es-cit, voluptaquam licidel inum que con nis modit lautatem untionsequis aut volessimus sequi.
                            </p>
                            <p style="font-size: 12px; line-height: 1.65; color: rgba(255,255,255,0.95); text-align: justify; font-family: 'Arial', sans-serif; margin: 0;">
                               Uatibea non pel-lam facepel laccumquid ut assi odise et audanis cietur aditatius.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #38bdf8; padding: 24px; color: #ffffff; border-radius: 12px; vertical-align: top; box-sizing: border-box;">
                            <div style="font-size: 16px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">TITLE GOES HERE</div>
                            <p style="font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.95); margin: 0; text-align: justify; font-family: 'Arial', sans-serif;">
                               Acienit id quatust ibustrum ese-qui dem velles pro te que nis ni maxim illaborae in et resectat et es as endus que esti ut omnien.
                            </p>
                            <div style="font-size: 10px; font-weight: bold; margin-top: 16px; text-transform: uppercase; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px; display: inline-block;">FINISH READING ON PG. 2</div>
                        </td>
                        <td style="padding: 0; vertical-align: top; border-radius: 12px; overflow: hidden; background-color: #e2e8f0; height: 160px; box-sizing: border-box;">
                            <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=60" style="width: 100%; height: 160px; object-fit: cover; display: block; filter: grayscale(100%);" alt="Students Group"/>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0; vertical-align: top; border-radius: 12px; overflow: hidden; background-color: #e2e8f0; height: 160px; box-sizing: border-box;">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60" style="width: 100%; height: 160px; object-fit: cover; display: block;" alt="Student Portrait"/>
                        </td>
                        <td style="background-color: #8e9ca3; padding: 24px; color: #ffffff; border-radius: 12px; vertical-align: top; box-sizing: border-box;">
                            <div style="font-size: 16px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">TITLE GOES HERE</div>
                            <p style="font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.95); margin: 0; text-align: justify; font-family: 'Arial', sans-serif;">
                               Acienit id quatust ibustrum ese-qui dem velles pro te que nis ni maxim illaborae in et resectat et es as endus que esti ut omnien.
                            </p>
                        </td>
                        <td style="background-color: #f1f5f9; padding: 24px; color: #64748b; border-radius: 12px; vertical-align: middle; text-align: center; border: 1px dashed #cbd5e1; box-sizing: border-box;">
                            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bellows College</div>
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">www.bellows.edu</div>
                        </td>
                    </tr>
                </table>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '📰 Elegant School Newsletter Layout',
        html: `
            <div style="font-family: 'Georgia', serif; color: #2d3748; line-height: 1.6; max-width: 850px; margin: 20px auto; padding: 30px; border: 1px solid #e2e8f0; border-top: 10px solid #1a365d; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="text-align: center; border-bottom: 2px double #1a365d; padding-bottom: 15px; margin-bottom: 25px;">
                    <h1 style="font-size: 36px; font-weight: bold; color: #1a365d; margin: 0; text-transform: uppercase; letter-spacing: 2px;">THE CAMPUS CHRONICLE</h1>
                    <p style="font-style: italic; color: #718096; margin: 5px 0 0 0; font-size: 14px;">Official Newsletter of Emerald Campus &bull; Autumn Edition 2026</p>
                </div>
                <div style="display: table; width: 100%; border-spacing: 0; margin-bottom: 20px;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; width: 65%; padding-right: 25px; vertical-align: top; border-right: 1px solid #e2e8f0;">
                            <h2 style="font-family: 'Arial', sans-serif; font-size: 22px; font-weight: bold; color: #2b6cb0; margin: 0 0 10px 0; text-transform: uppercase;">Revolutionizing Digital Learning</h2>
                            <p style="text-align: justify; margin: 0 0 15px 0; font-size: 14.5px;">
                                We are thrilled to introduce our new next-generation research clusters. These state-of-the-art interactive lab environments are fully configured with advanced modern software architectures, enabling hands-on practice for complex backend integrations and front-end system development.
                            </p>
                            <p style="text-align: justify; margin: 0 0 15px 0; font-size: 14.5px;">
                                Through direct industry alignment and active project simulations, students are prepared to tackle high-performance scalable systems right out of graduation. Learn more about joining our project cohort program this semester!
                            </p>
                            <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #2b6cb0; margin: 20px 0; font-style: italic; font-size: 15px; color: #4a5568;">
                                "Our mission remains steadfast: empowering students with industry-grade engineering frameworks to shape the digital landscapes of tomorrow."
                            </div>
                        </div>
                        <div style="display: table-cell; width: 35%; padding-left: 25px; vertical-align: top;">
                            <h3 style="font-family: 'Arial', sans-serif; font-size: 16px; font-weight: bold; color: #1a365d; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 1px solid #1a365d; padding-bottom: 5px;">Key Dates</h3>
                            <ul style="padding-left: 15px; margin: 0 0 25px 0; font-size: 13.5px; color: #4a5568; line-height: 1.8;">
                                <li><strong>Oct 15:</strong> Fall Intake Orientation</li>
                                <li><strong>Nov 02:</strong> Global Tech Symposium</li>
                                <li><strong>Dec 18:</strong> Winter Project Showcase</li>
                            </ul>
                            <h3 style="font-family: 'Arial', sans-serif; font-size: 16px; font-weight: bold; color: #1a365d; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 1px solid #1a365d; padding-bottom: 5px;">Editor Note</h3>
                            <p style="font-size: 13px; text-align: justify; color: #4a5568; margin: 0; line-height: 1.5;">
                                A warm welcome to all new cohort members! We hope this edition brings you inspiration and practical engineering insights to guide your career path.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '📢 Official School Notice Board Layout',
        html: `
            <div style="font-family: 'Times New Roman', Times, serif; color: #1a202c; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 40px; border: 2px solid #2d3748; background-color: #fffdf9; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
                <div style="text-align: center; border-bottom: 2px solid #2d3748; padding-bottom: 15px; margin-bottom: 25px;">
                    <h2 style="font-size: 24px; font-weight: bold; color: #2d3748; margin: 0; text-transform: uppercase; letter-spacing: 1px;">EMERALD ACADEMIC CAMPUS</h2>
                    <p style="margin: 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Office of the Registrar & Academic Council</p>
                    <p style="margin: 0; font-size: 13px; color: #718096;">Ref No: EAC/AC/2026/0942 &bull; Date: October 12, 2026</p>
                </div>
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="font-family: 'Arial', sans-serif; font-size: 20px; font-weight: 800; border-bottom: 2px solid #c53030; color: #c53030; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 1.5px;">ACADEMIC CIRCULAR</span>
                </div>
                <p style="font-weight: bold; font-size: 16px; margin: 0 0 15px 0; text-align: left;">
                    SUBJECT: IMPORTANT GUIDELINES FOR FINAL SEMESTER EXAMS & COHORT GRADUATION
                </p>
                <p style="text-align: justify; margin: 0 0 15px 0; font-size: 15px; text-indent: 40px;">
                    All final year students and faculty members are hereby informed that the upcoming Semester End Examinations will commence from <strong>November 16, 2026</strong>. Practical lab reviews, coding challenge assessments, and thesis project defenses are scheduled during the preparatory week starting November 09.
                </p>
                <p style="text-align: justify; margin: 0 0 15px 0; font-size: 15px; text-indent: 40px;">
                    All dynamic project codes, web application templates, and thesis layout reports must be fully pushed to the designated evaluation portals no later than Friday, November 06 at midnight. Late submissions will attract penalty scoring.
                </p>
                <div style="margin: 20px 0; padding-left: 20px; font-size: 14.5px;">
                    <p style="font-weight: bold; margin-bottom: 8px;">Key Compliance Guidelines:</p>
                    <ul style="padding-left: 20px; margin: 0; line-height: 1.8;">
                        <li>Ensure the dynamic front-end layout is fully responsive and interactive.</li>
                        <li>Verify that all API database queries are fully optimized.</li>
                        <li>Include functional unit tests for all primary transaction models.</li>
                    </ul>
                </div>
                <div style="margin-top: 40px; display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; width: 50%; text-align: left; vertical-align: bottom;">
                            <p style="margin: 0; font-size: 14px;"><strong>Issued By:</strong></p>
                            <p style="margin: 50px 0 0 0; font-size: 14px; font-weight: bold;">Dr. Julian Vance</p>
                            <p style="margin: 2px 0 0 0; font-size: 12px; color: #4a5568;">Controller of Examinations</p>
                        </div>
                        <div style="display: table-cell; width: 50%; text-align: right; vertical-align: bottom;">
                            <div style="display: inline-block; border: 1px dashed #cbd5e0; padding: 15px 25px; border-radius: 8px; text-align: center; background-color: #fafbfd; color: #718096; font-size: 12px;">
                                [Official Academic Seal]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '📊 Student Performance & Academic Report Layout',
        html: `
            <div style="font-family: 'Arial', sans-serif; color: #2d3748; line-height: 1.5; max-width: 800px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 800; color: #2b6cb0; margin: 0;">STUDENT PROGRESS & REPORT CARD</h2>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Academic Term: Fall Semester 2026 &bull; Cohort: A-3</p>
                    </div>
                    <div style="background-color: #ebf8ff; color: #2b6cb0; font-weight: 800; font-size: 12px; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">
                        Status: Active Pass
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13.5px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #718096; width: 20%;">Student Name:</td>
                        <td style="padding: 6px 0; color: #2d3748; font-weight: bold;">[Student Full Name]</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #718096; width: 20%;">Roll/ID:</td>
                        <td style="padding: 6px 0; color: #2d3748;">EAC-2026-9041</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #718096;">Program:</td>
                        <td style="padding: 6px 0; color: #2d3748;">Distributed Systems Engineering</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #718096;">GPA:</td>
                        <td style="padding: 6px 0; color: #2b6cb0; font-weight: bold;">3.85 / 4.00</td>
                    </tr>
                </table>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13.5px;">
                    <thead>
                        <tr style="background-color: #f7fafc; border-bottom: 2px solid #e2e8f0; color: #2d3748; text-align: left;">
                            <th style="padding: 10px; font-weight: 700;">Subject / Module Title</th>
                            <th style="padding: 10px; font-weight: 700; text-align: center; width: 15%;">Credits</th>
                            <th style="padding: 10px; font-weight: 700; text-align: center; width: 15%;">Grade</th>
                            <th style="padding: 10px; font-weight: 700; text-align: center; width: 15%;">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 10px; font-weight: bold; color: #2d3748;">Advanced Database Architectures</td>
                            <td style="padding: 10px; text-align: center; color: #4a5568;">4.0</td>
                            <td style="padding: 10px; text-align: center; font-weight: bold; color: #38a169;">A</td>
                            <td style="padding: 10px; text-align: center; color: #38a169; font-weight: bold;">Pass</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9; background-color: #fcfdfe;">
                            <td style="padding: 10px; font-weight: bold; color: #2d3748;">Responsive Frontend Design Systems</td>
                            <td style="padding: 10px; text-align: center; color: #4a5568;">3.0</td>
                            <td style="padding: 10px; text-align: center; font-weight: bold; color: #38a169;">A+</td>
                            <td style="padding: 10px; text-align: center; color: #38a169; font-weight: bold;">Pass</td>
                        </tr>
                        <tr style="border-bottom: 2px solid #e2e8f0;">
                            <td style="padding: 10px; font-weight: bold; color: #2d3748;">API Design & Network Security Middleware</td>
                            <td style="padding: 10px; text-align: center; color: #4a5568;">4.0</td>
                            <td style="padding: 10px; text-align: center; font-weight: bold; color: #dd6b20;">B+</td>
                            <td style="padding: 10px; text-align: center; color: #38a169; font-weight: bold;">Pass</td>
                        </tr>
                    </tbody>
                </table>
                <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 6px;">
                        <span contenteditable="true">Term Syllabus Completion</span>
                        <span class="prog-text" style="color: #2b6cb0;" contenteditable="true">78% Completed</span>
                    </div>
                    <div contenteditable="false" style="display: flex; align-items: center; margin-top: 6px;">
                        <input type="range" min="0" max="100" value="78" style="width: 100%; height: 8px; accent-color: #2b6cb0; cursor: pointer; border-radius: 4px; outline: none; -webkit-appearance: none; background: #e2e8f0;" oninput="this.setAttribute('value', this.value); this.parentElement.previousElementSibling.querySelector('.prog-text').innerText = this.value + '% Completed';" />
                    </div>
                </div>
                <div style="font-size: 13.5px; border-left: 3px solid #cbd5e0; padding-left: 15px; font-style: italic; color: #4a5568;">
                    "Remarks: [Student Name] has shown outstanding initiative during active lab coding simulations and group system designs. The analytical performance in database architecture was particularly notable."
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '📅 School Academic Calendar & Schedule Layout',
        html: `
            <div style="font-family: 'Arial', sans-serif; color: #2d3748; line-height: 1.5; max-width: 850px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
                <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="font-size: 22px; font-weight: 800; color: #2b6cb0; margin: 0;">ACADEMIC TIMELINE & KEY DATES</h2>
                    <p style="margin: 4px 0 0 0; font-size: 13.5px; color: #718096;">Upcoming schedules, public notices, and holidays for the current semester.</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; background-color: #fffaf0; border-left: 5px solid #dd6b20; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                        <div style="text-align: center; padding-right: 15px; border-right: 2px solid #e2e8f0; min-width: 80px; margin-right: 15px;">
                            <span style="display: block; font-size: 20px; font-weight: 800; color: #dd6b20;">Nov 16</span>
                            <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #718096;">Monday</span>
                        </div>
                        <div style="flex-grow: 1;">
                            <span style="background-color: #feebc8; color: #c05621; font-size: 10.5px; font-weight: bold; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Term Exams</span>
                            <h4 style="margin: 6px 0 2px 0; font-size: 15.5px; font-weight: bold; color: #2d3748;">Semester End Theoretical Examinations</h4>
                            <p style="margin: 0; font-size: 13px; color: #4a5568;">Comprehensive written exams for all undergraduate engineering modules starting at 09:30 AM.</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; background-color: #f7fafc; border-left: 5px solid #718096; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                        <div style="text-align: center; padding-right: 15px; border-right: 2px solid #e2e8f0; min-width: 80px; margin-right: 15px;">
                            <span style="display: block; font-size: 20px; font-weight: 800; color: #4a5568;">Nov 26</span>
                            <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #718096;">Thursday</span>
                        </div>
                        <div style="flex-grow: 1;">
                            <span style="background-color: #edf2f7; color: #4a5568; font-size: 10.5px; font-weight: bold; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Campus Holiday</span>
                            <h4 style="margin: 6px 0 2px 0; font-size: 15.5px; font-weight: bold; color: #2d3748;">Annual Thanksgiving Break</h4>
                            <p style="margin: 0; font-size: 13px; color: #4a5568;">Campus offices, engineering laboratories, and student classrooms will remain closed.</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; background-color: #f0fff4; border-left: 5px solid #38a169; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                        <div style="text-align: center; padding-right: 15px; border-right: 2px solid #e2e8f0; min-width: 80px; margin-right: 15px;">
                            <span style="display: block; font-size: 20px; font-weight: 800; color: #38a169;">Dec 05</span>
                            <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #718096;">Saturday</span>
                        </div>
                        <div style="flex-grow: 1;">
                            <span style="background-color: #c6f6d5; color: #22543d; font-size: 10.5px; font-weight: bold; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Lab Review</span>
                            <h4 style="margin: 6px 0 2px 0; font-size: 15.5px; font-weight: bold; color: #2d3748;">Dynamic App Showcase & Coding Review</h4>
                            <p style="margin: 0; font-size: 13px; color: #4a5568;">Active evaluation and live demo showcase of student web projects before internal juries.</p>
                        </div>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '✨ Premium Hero & Landing Page',
        html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; max-width: 900px; margin: 0 auto; padding: 0 16px;">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 24px; padding: 48px 32px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.15), 0 10px 10px -5px rgba(79, 70, 229, 0.04);">
                    <span style="background: rgba(255, 255, 255, 0.15); color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; margin-bottom: 16px;">
                        Welcome to the Future of Learning
                    </span>
                    <h1 style="font-size: 38px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -1px;">
                        Master the Arts & Sciences of Advanced Engineering
                    </h1>
                    <p style="font-size: 16.5px; color: #e0e7ff; max-width: 600px; margin: 0 auto 28px auto; line-height: 1.6;">
                        Accelerate your technical journey with our industry-led, research-backed comprehensive curriculum and real-world project simulations.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <a href="#" style="background: #ffffff; color: #4f46e5; font-weight: 700; font-size: 14.5px; padding: 12px 28px; border-radius: 12px; text-decoration: none; transition: transform 0.2s;">
                            Explore Programs
                        </a>
                        <a href="#" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff; font-weight: 600; font-size: 14.5px; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
                            Book a Consultation
                        </a>
                    </div>
                </div>
                <div style="margin: 48px 0 24px 0;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px;">Why Choose Emerald Campus?</h2>
                        <div style="width: 50px; height: 3px; background: #4f46e5; margin: 0 auto; border-radius: 2px;"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; gap: 16px; align-items: start; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <div style="background: #eef2ff; border-radius: 12px; padding: 10px; font-size: 24px; line-height: 1; flex-shrink: 0; color: #4f46e5;">🏆</div>
                            <div>
                                <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Global Accreditation</h4>
                                <p style="margin: 0; font-size: 13.5px; color: #64748b; line-height: 1.6;">Our programs are recognized by leading global institutions and industry bodies worldwide.</p>
                            </div>
                        </div>
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; gap: 16px; align-items: start; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <div style="background: #fdf2f8; border-radius: 12px; padding: 10px; font-size: 24px; line-height: 1; flex-shrink: 0; color: #db2777;">💻</div>
                            <div>
                                <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Elite Modern Labs</h4>
                                <p style="margin: 0; font-size: 13.5px; color: #64748b; line-height: 1.6;">Gain hands-on practice in state-of-the-art interactive lab environments configured to industry specs.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '📚 Modern Syllabus & Curriculum Page',
        html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 24px 16px;">
                <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
                    <span style="background-color: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Curriculum Overview
                    </span>
                    <h2 style="color: #4c1d95; font-size: 26px; font-weight: 800; margin: 12px 0 6px 0; letter-spacing: -0.5px;">Advanced Web Technologies & Systems Architecture</h2>
                    <p style="margin: 0; color: #6b21a8; font-size: 14.5px; font-weight: 500;">
                        Course Code: CS-402 &bull; Duration: 12 Weeks &bull; Level: Intermediate to Advanced
                    </p>
                </div>
                <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                    Timeline & Learning Modules
                </h3>
                <div style="border-left: 3px solid #e9d5ff; margin-left: 12px; padding-left: 24px; position: relative;">
                    <div style="margin-bottom: 32px; position: relative;">
                        <span style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; background-color: #a855f7; border-radius: 50%; outline: 4px solid #faf5ff;"></span>
                        <span style="color: #a855f7; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Weeks 1 - 4</span>
                        <h4 style="margin: 4px 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Phase 1: Foundations of Systems Design</h4>
                        <p style="margin: 0; font-size: 13.5px; color: #64748b; text-align: justify;">
                            Deep dive into HTTP/3 protocol mechanics, client-server communication channels, custom REST architectures, and responsive data schema validation patterns.
                        </p>
                    </div>
                    <div style="margin-bottom: 32px; position: relative;">
                        <span style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; background-color: #a855f7; border-radius: 50%; outline: 4px solid #faf5ff;"></span>
                        <span style="color: #a855f7; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Weeks 5 - 8</span>
                        <h4 style="margin: 4px 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Phase 2: Core Engineering & Database Optimization</h4>
                        <p style="margin: 0; font-size: 13.5px; color: #64748b; text-align: justify;">
                            Exploring relational and non-relational database design concepts, transactions, replication strategies, distributed system caching layers, and high-performance querying logic.
                        </p>
                    </div>
                    <div style="margin-bottom: 32px; position: relative;">
                        <span style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; background-color: #a855f7; border-radius: 50%; outline: 4px solid #faf5ff;"></span>
                        <span style="color: #a855f7; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Weeks 9 - 12</span>
                        <h4 style="margin: 4px 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Phase 3: Real-World Testing & Deployment Hub</h4>
                        <p style="margin: 0; font-size: 13.5px; color: #64748b; text-align: justify;">
                            Hands-on setup of automated testing pipelines, performance benchmarking, serverless cloud deployment, and containerization best practices using modern platforms.
                        </p>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '💳 Premium Fee Structure & Pricing Page',
        html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; max-width: 900px; margin: 0 auto; padding: 24px 16px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <span style="background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">Flexible Plans</span>
                    <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 8px 0 6px 0; letter-spacing: -0.5px;">Transparent Academic Programs Pricing</h2>
                    <p style="margin: 0; color: #64748b; font-size: 14.5px;">Select the learning model that fits your schedule and professional goals perfectly.</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px;">
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <h4 style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">Full-Time Campus Program</h4>
                        <p style="color: #64748b; font-size: 13px; margin: 4px 0 16px 0;">Best for dedicated, hands-on classroom learners.</p>
                        <div style="margin-bottom: 16px;">
                            <span style="font-size: 32px; font-weight: 800; color: #0f172a;">$2,450</span>
                            <span style="color: #64748b; font-size: 14px;"> / Semester</span>
                        </div>
                        <ul style="padding-left: 20px; margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.8;">
                            <li>Complete access to all physically on-campus engineering laboratories.</li>
                            <li>Weekly 1-on-1 personalized mentorship sessions.</li>
                            <li>Career development program & local interview access networks.</li>
                        </ul>
                        <a href="#" style="background-color: #0f172a; color: white; display: block; text-align: center; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: bold; font-size: 13.5px;">
                            Apply For Admission
                        </a>
                    </div>
                    <div style="background-color: #ffffff; border: 2px solid #3b82f6; border-radius: 20px; padding: 24px; position: relative; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.05);">
                        <div style="position: absolute; top: -12px; right: 24px; background-color: #3b82f6; color: white; font-size: 10.5px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Most Popular Option
                        </div>
                        <h4 style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">Flexible Blended Hybrid Program</h4>
                        <p style="color: #64748b; font-size: 13px; margin: 4px 0 16px 0;">Maximize versatility with mixed remote/physical setup options.</p>
                        <div style="margin-bottom: 16px;">
                            <span style="font-size: 32px; font-weight: 800; color: #0f172a;">$1,850</span>
                            <span style="color: #64748b; font-size: 14px;"> / Semester</span>
                        </div>
                        <ul style="padding-left: 20px; margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.8;">
                            <li>Flexible digital streaming syllabus lectures & bi-weekly lab support.</li>
                            <li>Interactive cohort project review circles.</li>
                            <li>Full access to all electronic engineering library resources.</li>
                        </ul>
                        <a href="#" style="background-color: #3b82f6; color: white; display: block; text-align: center; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: bold; font-size: 13.5px;">
                            Get Started Now
                        </a>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    },
    {
        name: '👥 Modern Faculty & Team Showcase Page',
        html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; max-width: 900px; margin: 0 auto; padding: 24px 16px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <span style="background-color: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">Meet the Faculty</span>
                    <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 8px 0 6px 0; letter-spacing: -0.5px;">Our Elite Academic Instructors</h2>
                    <p style="margin: 0; color: #64748b; font-size: 14.5px;">Learn from dedicated, world-class researchers and engineers guiding your engineering journey.</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; display: flex; gap: 20px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; border: 2px solid #e2e8f0;">
                            👨‍🏫
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16.5px; font-weight: bold; color: #0f172a;">Dr. Alexander Sterling</h4>
                            <p style="margin: 2px 0 6px 0; font-size: 13px; color: #4f46e5; font-weight: 600;">Department Chair, Systems Design</p>
                            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: justify;">
                                Specialist in distributed network optimization with 15+ years of active cloud infrastructure research.
                            </p>
                        </div>
                    </div>
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; display: flex; gap: 20px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; border: 2px solid #e2e8f0;">
                            👩‍🏫
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16.5px; font-weight: bold; color: #0f172a;">Prof. Sarah Jenkins</h4>
                            <p style="margin: 2px 0 6px 0; font-size: 13px; color: #4f46e5; font-weight: 600;">Lead Instructor, UI Engineering</p>
                            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: justify;">
                                Passionate about modern interface aesthetics, usability heuristics, and advanced responsive framework architectures.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <p><br/></p>
        `
    }
];

const SYMBOL_CATEGORIES = {
    Math: ['±', '×', '÷', '≈', '≠', '≤', '≥', '∞', '∑', '√', 'π', '∆'],
    Currency: ['$', '€', '£', '¥', '₹', '₪', '¢', '¤'],
    Arrows: ['←', '→', '↑', '↓', '↔', '⇒', '⇔', '▲', '▼', '◄', '►'],
    Emojis: ['😊', '🎉', '💡', '🔥', '📚', '⭐', '📢', '✅', '❌', '🚀', '🎓', '📅']
};

// ─── Symbol Picker Component ─────────────────────────────────────────────────
function SymbolPickerBtn({ onInsert }: { onInsert: (char: string) => void }) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'Emojis' | 'Symbols' | 'Math' | 'Currency'>('Emojis');
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const categoryMap: Record<typeof activeTab, string[]> = {
        Emojis: SYMBOL_CATEGORIES.Emojis,
        Symbols: SYMBOL_CATEGORIES.Arrows,
        Math: SYMBOL_CATEGORIES.Math,
        Currency: SYMBOL_CATEGORIES.Currency
    };

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                title="Insert Emoji or Symbol"
                onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
                className={`p-1.5 rounded transition-colors h-7 w-7 flex items-center justify-center text-slate-700 hover:bg-gray-100 ${open ? 'bg-gray-100' : ''}`}
            >
                <Smile className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-64 animate-fadeIn"
                >
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Symbols & Emojis
                    </p>
                    <div className="flex border-b border-gray-100 gap-1 pb-1">
                        {(['Emojis', 'Symbols', 'Math', 'Currency'] as const).map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${activeTab === tab ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1">
                        {categoryMap[activeTab].map(char => (
                            <button
                                key={char}
                                type="button"
                                onClick={() => {
                                    onInsert(char);
                                    setOpen(false);
                                }}
                                className="w-7 h-7 text-sm hover:scale-125 hover:bg-indigo-50 transition-all flex items-center justify-center rounded cursor-pointer border-none bg-transparent"
                            >
                                {char}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Start typing here…',
    minHeight = 280,
    className = '',
    onUploadImage,
    onInsertImageClick,
    onInsertFileClick: _onInsertFileClick,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const skipSync = useRef(false);
    const savedRange = useRef<Range | null>(null);

    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageModalTab, setImageModalTab] = useState<'upload' | 'url'>('upload');

    const [currentFont, setCurrentFont] = useState('Default');
    const [currentSize, setCurrentSize] = useState('14');
    const [currentHeading, setCurrentHeading] = useState('Paragraph');
    const [wordCount, setWordCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [isInTable, setIsInTable] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showStats, setShowStats] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<unknown>(null);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    
    const [showDrawModal, setShowDrawModal] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushWidth, setBrushWidth] = useState(3);
    const [isEraser, setIsEraser] = useState(false);
    const [hasUnsavedChange, setHasUnsavedChange] = useState(false);

    const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
    const [resizerRect, setResizerRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    const updateResizerRect = useCallback(() => {
        if (!selectedImg || !editorRef.current) {
            setResizerRect(null);
            return;
        }
        const imgBounds = selectedImg.getBoundingClientRect();
        const editorBounds = editorRef.current.getBoundingClientRect();

        // Calculate offset including the scroll position inside the editor
        setResizerRect({
            top: imgBounds.top - editorBounds.top + editorRef.current.scrollTop,
            left: imgBounds.left - editorBounds.left + editorRef.current.scrollLeft,
            width: imgBounds.width,
            height: imgBounds.height
        });
    }, [selectedImg]);

    const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedImg) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = selectedImg.clientWidth || selectedImg.offsetWidth;
        const startHeight = selectedImg.clientHeight || selectedImg.offsetHeight;
        const ratio = startWidth / startHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dX = moveEvent.clientX - startX;
            const dY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            if (handle === 'bottom-right' || handle === 'top-right') {
                newWidth = Math.max(40, startWidth + dX);
            } else if (handle === 'bottom-left' || handle === 'top-left') {
                newWidth = Math.max(40, startWidth - dX);
            }

            // Maintain aspect ratio
            const newHeight = Math.round(newWidth / ratio);

            selectedImg.style.width = `${Math.round(newWidth)}px`;
            selectedImg.style.height = `${newHeight}px`;
            selectedImg.style.maxWidth = '100%';

            updateResizerRect();
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            handleInput();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const applyImageAlignment = (align: 'left' | 'center' | 'right' | 'full' | 'reset') => {
        if (!selectedImg) return;

        if (align === 'left') {
            selectedImg.style.display = 'inline';
            selectedImg.style.float = 'left';
            selectedImg.style.marginLeft = '0px';
            selectedImg.style.marginRight = '16px';
            selectedImg.style.marginTop = '8px';
            selectedImg.style.marginBottom = '8px';
        } else if (align === 'center') {
            selectedImg.style.display = 'block';
            selectedImg.style.float = 'none';
            selectedImg.style.marginLeft = 'auto';
            selectedImg.style.marginRight = 'auto';
            selectedImg.style.marginTop = '12px';
            selectedImg.style.marginBottom = '12px';
        } else if (align === 'right') {
            selectedImg.style.display = 'inline';
            selectedImg.style.float = 'right';
            selectedImg.style.marginLeft = '16px';
            selectedImg.style.marginRight = '0px';
            selectedImg.style.marginTop = '8px';
            selectedImg.style.marginBottom = '8px';
        } else if (align === 'full') {
            selectedImg.style.display = 'block';
            selectedImg.style.float = 'none';
            selectedImg.style.width = '100%';
            selectedImg.style.height = 'auto';
            selectedImg.style.marginLeft = 'auto';
            selectedImg.style.marginRight = 'auto';
        } else if (align === 'reset') {
            selectedImg.style.display = '';
            selectedImg.style.float = '';
            selectedImg.style.width = '';
            selectedImg.style.height = '';
            selectedImg.style.margin = '';
        }

        updateResizerRect();
        handleInput();
    };

    const deleteImage = () => {
        if (!selectedImg) return;
        selectedImg.remove();
        setSelectedImg(null);
        handleInput();
    };

    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (editorRef.current?.contains(target) && target.tagName === 'IMG') {
                setSelectedImg(target as HTMLImageElement);
            } else if (!target.closest('.image-resizer-toolbar') && !target.closest('.image-resizer-handles')) {
                setSelectedImg(null);
            }
        };
        document.addEventListener('mousedown', handleDocumentClick);
        return () => document.removeEventListener('mousedown', handleDocumentClick);
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !selectedImg) return;

        const update = () => {
            updateResizerRect();
        };

        editor.addEventListener('scroll', update);
        window.addEventListener('resize', update);

        update();

        return () => {
            editor.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [selectedImg, updateResizerRect]);

    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        skipSync.current = true;
        onChange(editorRef.current.innerHTML);
        const text = editorRef.current.innerText ?? '';
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        setHasUnsavedChange(true);
    }, [onChange]);

    useEffect(() => {
        const checkSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0 || !editorRef.current) {
                setIsInTable(false);
                return;
            }
            let node = sel.anchorNode;
            let found = false;
            while (node && node !== editorRef.current) {
                if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
                    found = true;
                    break;
                }
                node = node ? node.parentNode : null;
            }
            setIsInTable(found);
        };

        document.addEventListener('selectionchange', checkSelection);
        return () => document.removeEventListener('selectionchange', checkSelection);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const win = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
            const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition() as {
                    continuous: boolean;
                    interimResults: boolean;
                    lang: string;
                    onresult: (e: unknown) => void;
                    onend: () => void;
                    onerror: () => void;
                    start: () => void;
                    stop: () => void;
                };
                rec.continuous = true;
                rec.interimResults = false;
                rec.lang = 'en-US';

                rec.onresult = (e: unknown) => {
                    const event = e as {
                        results: ArrayLike<{
                            isFinal: boolean;
                            0: { transcript: string };
                        }> & { length: number };
                    };
                    const result = event.results[event.results.length - 1];
                    if (result?.isFinal) {
                        const transcript = result[0].transcript;
                        editorRef.current?.focus();
                        document.execCommand('insertText', false, transcript + ' ');
                        handleInput();
                    }
                };

                rec.onend = () => {
                    setIsListening(false);
                };

                rec.onerror = () => {
                    setIsListening(false);
                };

                (recognitionRef as { current: unknown }).current = rec;
            }
        }
    }, [handleInput]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedDraft = localStorage.getItem('storio_rte_draft');
            if (savedDraft && savedDraft !== value && savedDraft !== '<p><br></p>' && savedDraft !== '') {
                setShowDraftBanner(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hasUnsavedChange) return;
        const interval = setInterval(() => {
            if (editorRef.current) {
                localStorage.setItem('storio_rte_draft', editorRef.current.innerHTML);
                setHasUnsavedChange(false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [hasUnsavedChange]);

    const toggleSpeech = () => {
        if (!recognitionRef.current) {
            alert('Web Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        const rec = recognitionRef.current as { start: () => void; stop: () => void };
        if (isListening) {
            rec.stop();
            setIsListening(false);
        } else {
            try {
                rec.start();
                setIsListening(true);
            } catch {
                // error or already running
            }
        }
    };

    const restoreDraft = () => {
        const savedDraft = localStorage.getItem('storio_rte_draft');
        if (savedDraft && editorRef.current) {
            editorRef.current.innerHTML = savedDraft;
            onChange(savedDraft);
            handleInput();
        }
        setShowDraftBanner(false);
    };

    const discardDraft = () => {
        localStorage.removeItem('storio_rte_draft');
        setShowDraftBanner(false);
    };

    useEffect(() => {
        if (editorRef.current && !skipSync.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value ?? '';
            }
        }
        skipSync.current = false;
    }, [value]);

    const applyWordArt = (effect: typeof WORDART_PRESETS[0]) => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        try {
            const range = sel.getRangeAt(0);
            const span = document.createElement('span');
            span.style.textShadow = effect.shadow;
            span.style.color = effect.color;
            if (effect.name === 'Neon Blue' || effect.name === 'Retro 3D Red' || effect.name === 'Shadow Outline') {
                span.style.background = '#1e293b';
                span.style.padding = '2px 6px';
                span.style.borderRadius = '4px';
            }
            range.surroundContents(span);
            handleInput();
        } catch {
            // fallback
        }
    };

    const insertCustomHr = (style: string, size: string, color: string) => {
        editorRef.current?.focus();
        const hrHtml = `<hr style="border:none;border-top:${size} ${style} ${color};margin:1.5rem 0;" /><p><br/></p>`;
        document.execCommand('insertHTML', false, hrHtml);
        handleInput();
    };

    const getStats = () => {
        if (!editorRef.current) return { words: 0, charsWithSpaces: 0, charsNoSpaces: 0, paragraphs: 0, readingTime: 0 };
        const text = editorRef.current.innerText ?? '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charsWithSpaces = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;
        const readingTime = Math.ceil(words / 200);
        return { words, charsWithSpaces, charsNoSpaces, paragraphs, readingTime };
    };

    const exec = useCallback((cmd: string, val: string = '') => {
        if (savedRange.current) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRange.current);
        }
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        handleInput();
        savedRange.current = null;
    }, [handleInput]);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const forceLtr = useCallback(() => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        editorRef.current.style.direction = 'ltr';
        document.execCommand('justifyLeft', false, '');
        handleInput();
    }, [handleInput]);

    const applyFont = (font: string) => {
        setCurrentFont(font);
        exec('fontName', font === 'Default' ? 'inherit' : font);
    };

    const applySize = (size: string) => {
        setCurrentSize(size);
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            document.execCommand('fontSize', false, '3');
            return;
        }
        try {
            const range = sel.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = `${size}px`;
            range.surroundContents(span);
            handleInput();
        } catch {
            document.execCommand('fontSize', false, '3');
        }
    };

    const applyHeading = (tag: string, label: string) => {
        setCurrentHeading(label);
        exec('formatBlock', tag);
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) exec('createLink', url);
    };

    const processAndInsertImageFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setIsUploadingImage(true);
        try {
            let finalUrl = '';
            if (onUploadImage) {
                finalUrl = await onUploadImage(file);
            } else {
                // Default: convert to Base64 data URL
                finalUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            if (finalUrl) {
                exec('insertImage', finalUrl);
            }
        } catch (err) {
            console.error('Failed to upload/insert image:', err);
        } finally {
            setIsUploadingImage(false);
            setShowImageModal(false);
        }
    }, [onUploadImage, exec]);

    const insertImage = () => {
        if (onInsertImageClick) {
            onInsertImageClick((url: string) => exec('insertImage', url));
        } else {
            // Save current selection range before opening modal
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                savedRange.current = sel.getRangeAt(0).cloneRange();
            }
            setImageUrlInput('');
            setShowImageModal(true);
        }
    };

    const insertTable = useCallback((rows: number, cols: number) => {
        const headerRow = `<tr>${Array(cols).fill('<th>Header</th>').join('')}</tr>`;
        const bodyRows = Array(rows - 1).fill(
            `<tr>${Array(cols).fill('<td>&nbsp;</td>').join('')}</tr>`
        ).join('');
        const tableHtml = `<table style="width:100%;"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table><p><br/></p>`;
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, tableHtml);
        handleInput();
    }, [handleInput]);

    const getActiveTableElements = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        let node = sel.anchorNode;
        let cell: HTMLTableCellElement | null = null;
        let row: HTMLTableRowElement | null = null;
        let table: HTMLTableElement | null = null;

        while (node && node !== editorRef.current) {
            if (node.nodeName === 'TD' || node.nodeName === 'TH') {
                cell = node as HTMLTableCellElement;
            } else if (node.nodeName === 'TR') {
                row = node as HTMLTableRowElement;
            } else if (node.nodeName === 'TABLE') {
                table = node as HTMLTableElement;
                break;
            }
            node = node.parentNode;
        }
        return table ? { cell, row, table } : null;
    }, []);

    const addRowAbove = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.row || !active.table) return;
        const newRow = active.table.insertRow(active.row.rowIndex);
        const cols = active.row.cells.length;
        for (let i = 0; i < cols; i++) {
            const referenceCell = active.row.cells[i];
            const isHeader = referenceCell ? referenceCell.nodeName === 'TH' : false;
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Header' : '&nbsp;';
            newRow.appendChild(newCell);
        }
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const addRowBelow = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.row || !active.table) return;
        const newRow = active.table.insertRow(active.row.rowIndex + 1);
        const cols = active.row.cells.length;
        for (let i = 0; i < cols; i++) {
            const referenceCell = active.row.cells[i];
            const isHeader = referenceCell ? referenceCell.nodeName === 'TH' : false;
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Header' : '&nbsp;';
            newRow.appendChild(newCell);
        }
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const addColumnLeft = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.cell || !active.table) return;
        const cellIndex = active.cell.cellIndex;
        Array.from(active.table.rows).forEach(r => {
            const referenceCell = r.cells[cellIndex];
            const isHeader = referenceCell ? referenceCell.nodeName === 'TH' : false;
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Header' : '&nbsp;';

            if (referenceCell) {
                r.insertBefore(newCell, referenceCell);
            } else {
                r.appendChild(newCell);
            }
        });
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const addColumnRight = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.cell || !active.table) return;
        const cellIndex = active.cell.cellIndex;
        Array.from(active.table.rows).forEach(r => {
            const referenceCell = r.cells[cellIndex];
            const isHeader = referenceCell ? referenceCell.nodeName === 'TH' : false;
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Header' : '&nbsp;';

            const nextCell = r.cells[cellIndex + 1];
            if (nextCell) {
                r.insertBefore(newCell, nextCell);
            } else {
                r.appendChild(newCell);
            }
        });
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const deleteRow = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.row || !active.table) return;
        active.table.deleteRow(active.row.rowIndex);
        if (active.table.rows.length === 0) {
            active.table.remove();
        }
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const deleteColumn = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.cell || !active.table) return;
        const cellIndex = active.cell.cellIndex;
        Array.from(active.table.rows).forEach(r => {
            r.deleteCell(cellIndex);
        });
        if (active.table.rows[0]?.cells.length === 0) {
            active.table.remove();
        }
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const deleteTable = useCallback(() => {
        const active = getActiveTableElements();
        if (!active || !active.table) return;
        active.table.remove();
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const setCellBgColor = useCallback((color: string) => {
        const active = getActiveTableElements();
        if (!active || !active.cell) return;
        active.cell.style.backgroundColor = color;
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const setTableDesign = useCallback((designClass: string) => {
        const active = getActiveTableElements();
        if (!active || !active.table) return;
        active.table.className = 'rte-table ' + designClass;
        handleInput();
    }, [getActiveTableElements, handleInput]);

    const handleSearchReplace = useCallback((replaceAll = false) => {
        if (!editorRef.current || !searchQuery) return;

        if (replaceAll) {
            const regex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            editorRef.current.innerHTML = editorRef.current.innerHTML.replace(regex, replaceQuery);
            handleInput();
        } else {
            const win = window as unknown as { find?: (q: string, cs: boolean, bw: boolean, wa: boolean, ww: boolean, sf: boolean, sd: boolean) => boolean };
            if (typeof window !== 'undefined' && win.find) {
                editorRef.current.focus();
                const found = win.find(searchQuery, false, false, true, false, true, false);
                if (found) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
                        document.execCommand('insertHTML', false, replaceQuery);
                        handleInput();
                    }
                } else {
                    alert('No more matches found.');
                }
            }
        }
    }, [searchQuery, replaceQuery, handleInput]);

    const applyLineSpacing = (spacing: string) => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        let node = sel.anchorNode as Node | null;
        while (node && node !== editorRef.current && node.nodeType !== 1) {
            node = node.parentNode;
        }
        if (node && node !== editorRef.current) {
            let target = node as HTMLElement;
            while (target && target !== editorRef.current && target.tagName === 'SPAN') {
                target = target.parentNode as HTMLElement;
            }
            if (target && target !== editorRef.current) {
                target.style.lineHeight = spacing;
                handleInput();
            }
        }
    };

    const applyCase = (caseType: 'uppercase' | 'lowercase' | 'capitalize') => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

        const range = sel.getRangeAt(0);
        const selectedText = range.toString();
        if (!selectedText) return;

        let transformedText = selectedText;
        if (caseType === 'uppercase') {
            transformedText = selectedText.toUpperCase();
        } else if (caseType === 'lowercase') {
            transformedText = selectedText.toLowerCase();
        } else if (caseType === 'capitalize') {
            transformedText = selectedText.replace(/\b\w+/g, word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
        }

        // Replace the selected text with the transformed text
        document.execCommand('insertText', false, transformedText);
        handleInput();
    };

    const fetchTranslation = async (text: string, targetLang: string): Promise<string> => {
        if (!text.trim()) return '';
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
            if (!response.ok) return text;
            const data = await response.json();
            let translatedText = '';
            if (data && data[0]) {
                data[0].forEach((segment: any) => {
                    if (segment[0]) translatedText += segment[0];
                });
            }
            return translatedText || text;
        } catch (err) {
            console.error(err);
            return text;
        }
    };

    const handleTranslate = async (targetLang: string) => {
        if (!editorRef.current) return;
        const sel = window.getSelection();

        const isSelectionValid = sel && !sel.isCollapsed && sel.toString().trim().length > 0;
        const range = isSelectionValid && sel ? sel.getRangeAt(0) : null;

        document.body.style.cursor = 'wait';

        const translateNode = async (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const originalText = node.nodeValue || '';
                if (originalText.trim()) {
                    if (range && !range.intersectsNode(node)) {
                        return;
                    }
                    const translated = await fetchTranslation(originalText, targetLang);
                    node.nodeValue = translated;
                }
            } else {
                const children = Array.from(node.childNodes);
                for (const child of children) {
                    await translateNode(child);
                }
            }
        };

        try {
            await translateNode(editorRef.current);
            handleInput();
        } catch (error) {
            console.error('Translation error:', error);
            alert('An error occurred during translation.');
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        // Check if pasting image files from clipboard (e.g. screenshot)
        const items = e.clipboardData.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        processAndInsertImageFile(file);
                        return;
                    }
                }
            }
        }

        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');

        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const cleanElement = (el: HTMLElement) => {
                el.removeAttribute('class');
                const style = el.getAttribute('style');
                if (style) {
                    const cleanStyles: string[] = [];
                    if (style.includes('color')) {
                        const match = style.match(/color\s*:\s*([^;]+)/);
                        if (match) cleanStyles.push(`color:${match[1]}`);
                    }
                    if (style.includes('font-weight')) {
                        cleanStyles.push('font-weight:bold');
                    }
                    if (cleanStyles.length > 0) {
                        el.setAttribute('style', cleanStyles.join(';'));
                    } else {
                        el.removeAttribute('style');
                    }
                }
                Array.from(el.children).forEach(child => cleanElement(child as HTMLElement));
            };

            cleanElement(doc.body);
            document.execCommand('insertHTML', false, doc.body.innerHTML);
        } else {
            document.execCommand('insertText', false, text);
        }
        handleInput();
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
        ctx.lineWidth = brushWidth;

        const rect = canvas.getBoundingClientRect();
        let x = 0;
        let y = 0;
        if ('touches' in e && e.touches.length > 0) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else if ('clientX' in e) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x = 0;
        let y = 0;
        if ('touches' in e && e.touches.length > 0) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else if ('clientX' in e) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const insertSketch = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        editorRef.current?.focus();
        const imgHtml = `<img src="${dataUrl}" alt="Canvas Sketch" style="max-width:100%; border-radius:8px; border: 1px solid #e2e8f0; margin:12px 0; display:block;" /><p><br/></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        handleInput();
        setShowDrawModal(false);
    };

    const insertShape = (type: string) => {
        editorRef.current?.focus();
        let html = '';
        if (type === 'process-block') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-block; vertical-align: middle; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #2563eb; border-radius: 12px; padding: 10px 15px; text-align: center; margin: 5px 8px; width: 160px; height: 80px; min-width: 80px; min-height: 40px; resize: both; overflow: auto; box-shadow: 0 4px 6px rgba(37,99,235,0.08); font-family: 'Arial', sans-serif; font-weight: bold; color: #1e40af; cursor: text;">[Process]</div>`;
        } else if (type === 'circle-badge') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-flex; vertical-align: middle; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #059669; border-radius: 50%; width: 100px; height: 100px; min-width: 50px; min-height: 50px; resize: both; overflow: hidden; align-items: center; justify-content: center; text-align: center; margin: 5px 8px; box-shadow: 0 4px 10px rgba(5,150,105,0.1); font-family: 'Arial', sans-serif; font-weight: 800; color: #065f46; cursor: text; padding: 8px; box-sizing: border-box; line-height: 1.2;">[Badge]</div>`;
        } else if (type === 'speech-callout') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-block; vertical-align: middle; position: relative; background: #faf5ff; border: 2px solid #7c3aed; border-radius: 16px; padding: 10px 15px; margin: 5px 8px 15px 8px; width: 180px; height: 80px; min-width: 90px; min-height: 45px; resize: both; overflow: auto; box-shadow: 0 4px 12px rgba(124,58,237,0.06); font-family: 'Arial', sans-serif; color: #5b21b6; cursor: text;"><div style="font-weight: bold;">[Callout]</div><div style="position: absolute; bottom: -10px; left: 30px; width: 0; height: 0; border-width: 10px 10px 0; border-style: solid; border-color: #7c3aed transparent transparent;"></div><div style="position: absolute; bottom: -7px; left: 31px; width: 0; height: 0; border-width: 8px 8px 0; border-style: solid; border-color: #faf5ff transparent transparent;"></div></div>`;
        } else if (type === 'banner-ribbon') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-block; vertical-align: middle; position: relative; background: linear-gradient(to right, #4338ca, #3730a3); color: #ffffff; padding: 8px 20px; text-align: center; margin: 5px 8px; width: 220px; height: 40px; min-width: 120px; min-height: 35px; resize: both; overflow: auto; font-family: 'Arial', sans-serif; font-weight: 800; font-size: 13px; box-shadow: 0 4px 10px rgba(67,56,202,0.25); border-radius: 4px; cursor: text;">✨ [BANNER] ✨</div>`;
        } else if (type === 'star-burst') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-flex; vertical-align: middle; background: #fff7ed; border: 2px dashed #ea580c; border-radius: 30px 10px 30px 10px; width: 100px; height: 100px; min-width: 50px; min-height: 50px; resize: both; overflow: hidden; align-items: center; justify-content: center; text-align: center; margin: 5px 8px; box-shadow: 0 4px 8px rgba(234,88,12,0.1); font-family: 'Arial', sans-serif; font-weight: 900; color: #c2410c; cursor: text; padding: 8px; box-sizing: border-box; line-height: 1.1; font-size: 11px;">🔥 [STAR]</div>`;
        } else if (type === 'academic-shield') {
            html = `<div title="Drag bottom-right corner to resize shape" style="display: inline-flex; flex-direction: column; vertical-align: middle; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #d97706; border-radius: 12px 12px 50% 50%; width: 110px; height: 130px; min-width: 70px; min-height: 80px; resize: both; overflow: hidden; padding: 15px 10px 10px 10px; text-align: center; margin: 5px 8px; box-shadow: 0 6px 12px rgba(217,119,6,0.1); font-family: 'Arial', sans-serif; font-weight: 800; color: #78350f; cursor: text; box-sizing: border-box; align-items: center; justify-content: center;"><div style="font-size: 9px; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 2px;">EST. 2026</div><div style="font-size: 13px; font-weight: 900; line-height: 1.1;">[SHIELD]</div></div>`;
        } else if (type === 'arrow-right') {
            html = `<div title="Drag bottom-right corner to resize arrow" style="display: inline-block; width: 80px; height: 48px; min-width: 30px; min-height: 20px; resize: both; overflow: hidden; margin: 0 6px; cursor: move; vertical-align: middle;"><svg width="100%" height="100%" viewBox="0 0 100 60" style="display: block;"><path d="M 0,20 L 60,20 L 60,0 L 100,30 L 60,60 L 60,40 L 0,40 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" style="filter: drop-shadow(0px 3px 5px rgba(29,78,216,0.3));" /></svg></div>`;
        } else if (type === 'arrow-left') {
            html = `<div title="Drag bottom-right corner to resize arrow" style="display: inline-block; width: 80px; height: 48px; min-width: 30px; min-height: 20px; resize: both; overflow: hidden; margin: 0 6px; cursor: move; vertical-align: middle;"><svg width="100%" height="100%" viewBox="0 0 100 60" style="display: block;"><path d="M 100,20 L 40,20 L 40,0 L 0,30 L 40,60 L 40,40 L 100,40 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" style="filter: drop-shadow(0px 3px 5px rgba(29,78,216,0.3));" /></svg></div>`;
        } else if (type === 'arrow-up') {
            html = `<div title="Drag bottom-right corner to resize arrow" style="display: inline-block; width: 48px; height: 80px; min-width: 20px; min-height: 30px; resize: both; overflow: hidden; margin: 0 6px; cursor: move; vertical-align: middle;"><svg width="100%" height="100%" viewBox="0 0 60 100" style="display: block;"><path d="M 20,100 L 20,40 L 0,40 L 30,0 L 60,40 L 40,40 L 40,100 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" style="filter: drop-shadow(0px 3px 5px rgba(29,78,216,0.3));" /></svg></div>`;
        } else if (type === 'arrow-down') {
            html = `<div title="Drag bottom-right corner to resize arrow" style="display: inline-block; width: 48px; height: 80px; min-width: 20px; min-height: 30px; resize: both; overflow: hidden; margin: 0 6px; cursor: move; vertical-align: middle;"><svg width="100%" height="100%" viewBox="0 0 60 100" style="display: block;"><path d="M 20,0 L 20,60 L 0,60 L 30,100 L 60,60 L 40,60 L 40,0 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" style="filter: drop-shadow(0px 3px 5px rgba(29,78,216,0.3));" /></svg></div>`;
        }
        document.execCommand('insertHTML', false, html);
        handleInput();
    };

    const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            alert('Please select a valid Microsoft Word (.docx) file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) return;

            try {
                const convertImageOption = mammoth.images ? mammoth.images.imgElement(function(image: any) {
                    return image.readAsBase64String().then(function(base64String: string) {
                        return {
                            src: "data:" + image.contentType + ";base64," + base64String
                        };
                    });
                }) : undefined;

                const options = {
                    convertImage: convertImageOption
                };

                const result = await mammoth.convertToHtml({ arrayBuffer }, options);
                const html = result.value;

                if (editorRef.current) {
                    editorRef.current.focus();

                    const wordHtml = `
                        <div class="word-imported-content" style="margin: 20px 0; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 35px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;">
                            <style>
                                .word-imported-content p {
                                    font-size: 14px !important;
                                    line-height: 1.65 !important;
                                    color: #334155 !important;
                                    margin-bottom: 14px !important;
                                }
                                .word-imported-content h1, 
                                .word-imported-content h2, 
                                .word-imported-content h3 {
                                    color: #0f172a !important;
                                    font-weight: 700 !important;
                                    margin-top: 28px !important;
                                    margin-bottom: 14px !important;
                                }
                                .word-imported-content img {
                                    max-width: 100% !important;
                                    height: auto !important;
                                    border-radius: 12px !important;
                                    margin: 20px 0 !important;
                                    box-shadow: 0 12px 30px rgba(0,0,0,0.07) !important;
                                    border: 1px solid #f1f5f9 !important;
                                    display: block !important;
                                }
                                .word-imported-content table {
                                    width: 100% !important;
                                    border-collapse: collapse !important;
                                    margin: 24px 0 !important;
                                }
                                .word-imported-content td, 
                                .word-imported-content th {
                                    border: 1px solid #e2e8f0 !important;
                                    padding: 14px !important;
                                    vertical-align: top !important;
                                }
                            </style>
                            ${html}
                        </div>
                        <p><br/></p>
                    `;

                    const inserted = document.execCommand('insertHTML', false, wordHtml);
                    
                    if (!inserted) {
                        editorRef.current.innerHTML += wordHtml;
                    }
                    
                    handleInput();
                }
            } catch (err) {
                console.error("Failed to parse Word document:", err);
                alert("Failed to parse Word document. Please ensure it is a valid, uncorrupted .docx file.");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

    const editorContent = (
        <div className={`border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col ${className} ${isFullscreen ? '!fixed !inset-0 !z-[999999] !w-screen !h-screen !rounded-none !m-0 !border-none' : ''}`}>

            {showDraftBanner && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between animate-fadeIn text-xs text-indigo-900 font-semibold select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <span>We found an unsaved draft from your last session. Would you like to restore it?</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={restoreDraft}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shadow-xs border-none"
                        >
                            Restore Draft
                        </button>
                        <button
                            type="button"
                            onClick={discardDraft}
                            className="bg-transparent hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer border-none"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex flex-wrap gap-0.5 items-center">

                <ToolDropdown label={currentHeading} minW={170}>
                    {HEADINGS.map(h => (
                        <DropItem key={h.tag} onClick={() => applyHeading(h.tag, h.label)}>
                            <span className={
                                h.tag === 'h1' ? 'text-2xl font-bold' :
                                    h.tag === 'h2' ? 'text-xl font-bold' :
                                        h.tag === 'h3' ? 'text-lg font-semibold' :
                                            h.tag === 'h4' ? 'text-base font-semibold' :
                                                h.tag === 'h5' ? 'text-sm font-semibold' :
                                                    h.tag === 'h6' ? 'text-xs font-semibold' : 'text-sm'
                            }>
                                {h.label}
                            </span>
                        </DropItem>
                    ))}
                </ToolDropdown>

                <ToolDropdown
                    label={<span style={{ fontFamily: currentFont !== 'Default' ? currentFont : undefined }}>{currentFont}</span>}
                    minW={190}
                >
                    {FONTS.map(f => (
                        <DropItem key={f} onClick={() => applyFont(f)}>
                            <span style={{ fontFamily: f !== 'Default' ? f : undefined }}>{f}</span>
                        </DropItem>
                    ))}
                </ToolDropdown>

                <ToolDropdown label={`${currentSize}pt`} minW={80}>
                    {SIZES.map(s => (
                        <DropItem key={s} onClick={() => applySize(s)}>
                            <span style={{ fontSize: `${Math.min(parseInt(s), 24)}px` }}>{s}</span>
                        </DropItem>
                    ))}
                </ToolDropdown>

                <Divider />

                <ToolBtn onClick={() => exec('bold')} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('italic')} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('underline')} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('superscript')} title="Superscript"><Superscript className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('subscript')} title="Subscript"><Subscript className="w-3.5 h-3.5" /></ToolBtn>

                <Divider />

                <ToolDropdown label={<Type className="w-3.5 h-3.5" />} minW={140}>
                    <DropItem onClick={() => applyCase('uppercase')}>UPPERCASE</DropItem>
                    <DropItem onClick={() => applyCase('lowercase')}>lowercase</DropItem>
                    <DropItem onClick={() => applyCase('capitalize')}>Capitalize Each Word</DropItem>
                </ToolDropdown>

                <ToolDropdown label={<span className="flex items-center gap-1 font-bold"><span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-extrabold text-sm">A</span> WordArt</span>} minW={220}>
                    <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                        Typography Presets
                    </div>
                    {WORDART_PRESETS.map(p => (
                        <DropItem key={p.name} onClick={() => applyWordArt(p)}>
                            <span
                                className="text-sm font-extrabold"
                                style={{
                                    textShadow: p.shadow,
                                    color: p.color,
                                    background: p.name === 'Neon Blue' || p.name === 'Retro 3D Red' || p.name === 'Shadow Outline' ? '#1e293b' : 'transparent',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-block'
                                }}
                            >
                                {p.name}
                            </span>
                        </DropItem>
                    ))}
                </ToolDropdown>

                <Divider />

                <ToolDropdown label={<><Palette className="w-3.5 h-3.5" /><span className="ml-0.5">A</span></>} minW={190} align="right">
                    <div className="flex flex-wrap gap-2 p-2.5 justify-center">
                        {TEXT_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
                                className="w-6.5 h-6.5 rounded-full border border-gray-200 cursor-pointer hover:scale-115 active:scale-95 transition-all shadow-xs"
                                style={{ background: c }}
                                title={c}
                            />
                        ))}
                        <label
                            className="w-6.5 h-6.5 rounded-full border border-gray-200 cursor-pointer hover:scale-115 active:scale-95 transition-all flex items-center justify-center bg-white shadow-xs overflow-hidden relative"
                            title="Custom Color"
                            onMouseDown={saveSelection}
                        >
                            <Plus className="w-3 h-3 text-gray-400" />
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onInput={e => exec('foreColor', (e.target as HTMLInputElement).value)}
                            />
                        </label>
                    </div>
                </ToolDropdown>

                <ToolDropdown label={<Highlighter className="w-3.5 h-3.5" />} minW={190} align="right">
                    <div className="flex flex-wrap gap-2 p-2.5 justify-center">
                        {HIGHLIGHT_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={e => { e.preventDefault(); exec('backColor', c); }}
                                className="w-6.5 h-6.5 rounded-full border border-gray-200 cursor-pointer hover:scale-115 active:scale-95 transition-all shadow-xs"
                                style={{ background: c === 'transparent' ? 'white' : c }}
                                title={c === 'transparent' ? 'No highlight' : c}
                            />
                        ))}
                        <label
                            className="w-6.5 h-6.5 rounded-full border border-gray-200 cursor-pointer hover:scale-115 active:scale-95 transition-all flex items-center justify-center bg-white shadow-xs overflow-hidden relative"
                            title="Custom Highlight"
                            onMouseDown={saveSelection}
                        >
                            <Plus className="w-3 h-3 text-gray-400" />
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onInput={e => exec('backColor', (e.target as HTMLInputElement).value)}
                            />
                        </label>
                    </div>
                </ToolDropdown>

                <Divider />

                <ToolBtn onClick={() => exec('justifyLeft')} title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyCenter')} title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyRight')} title="Align Right"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyFull')} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></ToolBtn>

                <ToolDropdown label={<ArrowUpDown className="w-3.5 h-3.5" />} minW={100}>
                    {['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'].map(s => (
                        <DropItem key={s} onClick={() => applyLineSpacing(s)}>
                            {s}
                        </DropItem>
                    ))}
                </ToolDropdown>

                <Divider />

                <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('outdent')} title="Outdent"><Outdent className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('indent')} title="Indent"><Indent className="w-3.5 h-3.5" /></ToolBtn>

                <Divider />

                <ToolBtn
                    onClick={() => exec('insertHTML', '<pre style="background:#f1f5f9;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:13px"><code></code></pre><p><br/></p>')}
                    title="Code Block"
                >
                    <Code className="w-3.5 h-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote">
                    <Quote className="w-3.5 h-3.5" />
                </ToolBtn>
                <CustomHrBtn onInsert={insertCustomHr} />

                <Divider />

                <ToolBtn onClick={insertLink} title="Insert Link"><LinkIcon className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={insertImage} title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => setShowDrawModal(true)} title="Signature & Canvas Sketch Pad">
                    <Brush className="w-3.5 h-3.5 text-slate-700" />
                </ToolBtn>
                <TablePickerBtn onInsert={insertTable} />

                <ToolDropdown
                    label={
                        <span className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            <Shapes className="w-3.5 h-3.5 text-indigo-600" /> Shapes
                        </span>
                    }
                    minW={230}
                    align="right"
                >
                    <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                        Insert Page Shapes
                    </div>
                    <DropItem onClick={() => insertShape('process-block')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-3.5 h-3 bg-blue-500 rounded-xs border border-blue-600 block shrink-0" />
                            🟦 Process Block (Rectangle)
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('circle-badge')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full border border-emerald-600 block shrink-0" />
                            🟢 Round Badge (Circle)
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('speech-callout')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-purple-600 text-xs font-extrabold block shrink-0">💬</span>
                            💬 Speech Callout Bubble
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('banner-ribbon')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-4 h-2.5 bg-indigo-600 border border-indigo-700 block shrink-0" />
                            🎀 Elegant Banner Ribbon
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('star-burst')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-orange-500 text-xs font-extrabold block shrink-0">⭐</span>
                            ⭐ Starburst Sticker
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('academic-shield')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-amber-600 text-xs font-extrabold block shrink-0">🛡️</span>
                            🛡️ Academic Insignia Shield
                        </span>
                    </DropItem>
                    
                    <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mt-1">
                        Insert Arrows (MS Word)
                    </div>
                    <DropItem onClick={() => insertShape('arrow-right')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-blue-500 text-sm font-extrabold block shrink-0">➡️</span>
                            ➡️ Arrow Right
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('arrow-left')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-blue-500 text-sm font-extrabold block shrink-0">⬅️</span>
                            ⬅️ Arrow Left
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('arrow-up')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-blue-500 text-sm font-extrabold block shrink-0">⬆️</span>
                            ⬆️ Arrow Up
                        </span>
                    </DropItem>
                    <DropItem onClick={() => insertShape('arrow-down')}>
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-blue-500 text-sm font-extrabold block shrink-0">⬇️</span>
                            ⬇️ Arrow Down
                        </span>
                    </DropItem>
                </ToolDropdown>

                <Divider />
                <ToolBtn
                    onClick={toggleSpeech}
                    title="Voice Typing (Speech-to-Text)"
                    className={isListening ? 'bg-red-50 hover:bg-red-100 border border-red-200' : ''}
                >
                    <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse text-red-600' : 'text-slate-700'}`} />
                </ToolBtn>

                <label
                    title="Import MS Word (.docx) File"
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:bg-gray-100 hover:border-gray-200 active:scale-95 transition-all cursor-pointer text-slate-700 shrink-0 relative"
                >
                    <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                    <input
                        type="file"
                        accept=".docx"
                        onChange={handleWordImport}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>

                <SymbolPickerBtn
                    onInsert={(char) => {
                        editorRef.current?.focus();
                        document.execCommand('insertText', false, char);
                        handleInput();
                    }}
                />

                <ToolDropdown
                    label={
                        <span className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Templates
                        </span>
                    }
                    minW={320}
                    align="left"
                >
                    <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                        Insert Document Layout
                    </div>
                    {TEMPLATES.map(t => (
                        <DropItem
                            key={t.name}
                            onClick={() => {
                                editorRef.current?.focus();
                                document.execCommand('insertHTML', false, t.html);
                                handleInput();
                            }}
                        >
                            <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                        </DropItem>
                    ))}
                </ToolDropdown>

                {isInTable && (
                    <>
                        <Divider />
                        <ToolDropdown
                            label={
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 animate-pulse">
                                    <Grid className="w-3.5 h-3.5" /> Table Layout
                                </span>
                            }
                            minW={220}
                        >
                            <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                                Table Designs (MS Word Style)
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-2 border-b border-gray-100 bg-gray-50">
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-default'); }}
                                    className="px-2 py-1 text-[10px] bg-white border border-gray-200 rounded font-semibold text-gray-700 hover:bg-gray-100 text-left transition-colors"
                                >
                                    Classic Grey
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-emerald'); }}
                                    className="px-2 py-1 text-[10px] bg-emerald-50 border border-emerald-100 rounded font-semibold text-emerald-800 hover:bg-emerald-100 text-left transition-colors"
                                >
                                    Emerald Green
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-blue'); }}
                                    className="px-2 py-1 text-[10px] bg-blue-50 border border-blue-100 rounded font-semibold text-blue-800 hover:bg-blue-100 text-left transition-colors"
                                >
                                    Deep Blue
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-red'); }}
                                    className="px-2 py-1 text-[10px] bg-red-50 border border-red-100 rounded font-semibold text-red-800 hover:bg-red-100 text-left transition-colors"
                                >
                                    Warm Red
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-dark'); }}
                                    className="px-2 py-1 text-[10px] bg-slate-800 border border-slate-700 rounded font-semibold text-white hover:bg-slate-700 text-left transition-colors"
                                >
                                    Slate Dark
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setTableDesign('theme-minimal'); }}
                                    className="px-2 py-1 text-[10px] bg-white border border-dashed border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors"
                                >
                                    Minimal Clean
                                </button>
                            </div>

                            <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mt-1">
                                Layout Operations
                            </div>
                            <DropItem onClick={addRowAbove}>Insert Row Above</DropItem>
                            <DropItem onClick={addRowBelow}>Insert Row Below</DropItem>
                            <DropItem onClick={addColumnLeft}>Insert Column Left</DropItem>
                            <DropItem onClick={addColumnRight}>Insert Column Right</DropItem>

                            <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mt-1">
                                Delete Operations
                            </div>
                            <DropItem onClick={deleteRow} className="text-red-600 hover:bg-red-50">Delete Row</DropItem>
                            <DropItem onClick={deleteColumn} className="text-red-600 hover:bg-red-50">Delete Column</DropItem>
                            <DropItem onClick={deleteTable} className="text-red-700 hover:bg-red-100 font-bold">Delete Table</DropItem>

                            <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 mt-1">
                                Cell Background
                            </div>
                            <div className="flex flex-wrap gap-1 p-2">
                                {TEXT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onMouseDown={e => { e.preventDefault(); setCellBgColor(c); }}
                                        className="w-5 h-5 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                                        style={{ background: c }}
                                        title={`Cell BG: ${c}`}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); setCellBgColor('transparent'); }}
                                    className="grow px-2 py-1 text-[9px] rounded border border-gray-200 hover:bg-gray-50 font-bold text-slate-700 transition-colors"
                                >
                                    Clear Color
                                </button>
                            </div>
                        </ToolDropdown>
                    </>
                )}

                <Divider />

                <ToolBtn onClick={() => exec('copy')} title="Copy"><Copy className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('cut')} title="Cut"><Scissors className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('selectAll')} title="Select All"><MousePointer2 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('removeFormat')} title="Clear Formatting"><Eraser className="w-3.5 h-3.5" /></ToolBtn>

                <Divider />

                <ToolBtn onClick={() => exec('undo')} title="Undo"><Undo className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('redo')} title="Redo"><Redo className="w-3.5 h-3.5" /></ToolBtn>
                <ToolDropdown label={<span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700"><Languages className="w-3.5 h-3.5" /> Translate</span>} minW={145} align="right">
                    <DropItem onClick={() => handleTranslate('en')}>English</DropItem>
                    <DropItem onClick={() => handleTranslate('bn')}>Bengali (বাংলা)</DropItem>
                    <DropItem onClick={() => handleTranslate('ar')}>Arabic (العربية)</DropItem>
                    <DropItem onClick={() => handleTranslate('es')}>Spanish (Español)</DropItem>
                    <DropItem onClick={() => handleTranslate('hi')}>Hindi (हिन्दी)</DropItem>
                    <DropItem onClick={() => handleTranslate('fr')}>French (Français)</DropItem>
                </ToolDropdown>
                <ToolBtn onClick={() => setShowSearch(!showSearch)} title="Search & Replace" active={showSearch}>
                    <Search className="w-3.5 h-3.5" />
                </ToolBtn>
                <ToolBtn onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                    {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                </ToolBtn>

                <ToolBtn onClick={forceLtr} title="Left-to-Right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 5H3" /><path d="M11 9H3" /><path d="M11 13H3" /><path d="M17 17H3" /><path d="M21 12l-4 4-4-4" />
                    </svg>
                </ToolBtn>
            </div>

            {showSearch && (
                <div className="bg-gray-50/90 backdrop-blur-xs border-b border-gray-200 px-4 py-2.5 flex flex-wrap gap-2 items-center justify-between text-xs transition-all duration-300">
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-xs">
                            <Search className="w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Find..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="outline-none w-36 bg-transparent text-slate-700 text-xs font-semibold"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-xs">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Replace</span>
                            <input
                                type="text"
                                placeholder="Replace with..."
                                value={replaceQuery}
                                onChange={e => setReplaceQuery(e.target.value)}
                                className="outline-none w-36 bg-transparent text-slate-700 text-xs font-semibold"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSearchReplace(false)}
                            className="px-3 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold border border-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer text-xs"
                        >
                            Find & Replace Next
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSearchReplace(true)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-bold transition-colors cursor-pointer text-xs shadow-xs"
                        >
                            Replace All
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSearch(false)}
                        className="text-gray-400 hover:text-gray-600 font-bold px-2 py-0.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="relative grow flex flex-col min-h-0">
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    dir="ltr"
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onDrop={(e) => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                            for (let i = 0; i < files.length; i++) {
                                if (files[i].type.startsWith('image/')) {
                                    processAndInsertImageFile(files[i]);
                                    break;
                                }
                            }
                        }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onFocus={forceLtr}
                    data-placeholder={placeholder}
                    className="grow outline-none px-5 py-4 text-slate-700 text-sm text-left overflow-y-auto rte-content w-full"
                    style={{ minHeight }}
                />

                {selectedImg && resizerRect && (
                    <>
                        <div
                            className="image-resizer-handles absolute pointer-events-none z-40"
                            style={{
                                top: resizerRect.top,
                                left: resizerRect.left,
                                width: resizerRect.width,
                                height: resizerRect.height,
                                outline: '2px solid #6366f1',
                                outlineOffset: '2px',
                            }}
                        >
                            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(handle => {
                                const isTop = handle.startsWith('top');
                                const isLeft = handle.endsWith('left');
                                return (
                                    <div
                                        key={handle}
                                        onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                                        className="absolute w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-pointer pointer-events-auto hover:bg-indigo-600 hover:scale-125 transition-all shadow-md"
                                        style={{
                                            top: isTop ? '-6px' : 'auto',
                                            bottom: isTop ? 'auto' : '-6px',
                                            left: isLeft ? '-6px' : 'auto',
                                            right: isLeft ? 'auto' : '-6px',
                                            cursor: handle === 'top-left' || handle === 'bottom-right' ? 'nwse-resize' : 'nesw-resize'
                                        }}
                                        title="Drag to resize image"
                                    />
                                );
                            })}
                        </div>

                        <div
                            className="image-resizer-toolbar absolute bg-slate-900/95 border border-slate-800 text-white rounded-xl shadow-2xl p-1 flex items-center gap-1 z-50 select-none animate-fadeIn backdrop-blur-xs"
                            style={{
                                top: Math.max(8, resizerRect.top - 46),
                                left: Math.max(8, resizerRect.left + (resizerRect.width / 2) - 150),
                                height: '36px'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => applyImageAlignment('left')}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                title="Align Left"
                            >
                                ⬅️ Left
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment('center')}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                title="Align Center"
                            >
                                ↔️ Center
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment('right')}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                title="Align Right"
                            >
                                ➡️ Right
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment('full')}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                title="Full Width"
                            >
                                🖥️ Full
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment('reset')}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                title="Reset Size"
                            >
                                🔄 Reset
                            </button>
                            <div className="w-px h-4 bg-slate-800 mx-0.5 shrink-0" />
                            <button
                                type="button"
                                onClick={deleteImage}
                                className="px-2 py-1 text-[11px] font-bold bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition cursor-pointer flex items-center border-none"
                                title="Delete Image"
                            >
                                🗑️
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="px-4 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between relative">
                <div className="flex items-center gap-1.5 select-none">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChange ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] text-gray-400 font-semibold">
                        {hasUnsavedChange ? 'Saving draft...' : 'Draft Autosaved'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setShowStats(!showStats)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                >
                    📊 Detail Statistics ({wordCount} words)
                </button>

                {showStats && (
                    <div className="absolute right-4 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-64 select-none animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                📊 Document Statistics
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowStats(false)}
                                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {(() => {
                            const stats = getStats();
                            return (
                                <div className="flex flex-col gap-2.5 text-xs text-slate-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Words</span>
                                        <span className="font-extrabold text-indigo-600">{stats.words}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Characters (no spaces)</span>
                                        <span className="font-bold">{stats.charsNoSpaces}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Characters (with spaces)</span>
                                        <span className="font-bold">{stats.charsWithSpaces}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Paragraphs</span>
                                        <span className="font-bold">{stats.paragraphs}</span>
                                    </div>
                                    <div className="h-px bg-gray-100 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Est. Reading Time</span>
                                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                                            ~ {stats.readingTime} min
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {showDrawModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-[560px] flex flex-col gap-4 border border-gray-100 animate-slideUp">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                🎨 Signature & Canvas Freehand Sketch
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowDrawModal(false)}
                                className="text-gray-400 hover:text-gray-600 font-extrabold text-sm hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative border border-gray-200 rounded-2xl bg-gray-50/50 overflow-hidden shadow-inner flex items-center justify-center">
                            <canvas
                                ref={canvasRef}
                                width={512}
                                height={280}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="cursor-crosshair bg-white"
                                style={{ width: 512, height: 280 }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-2">
                                {['#000000', '#2563eb', '#dc2626', '#16a34a', '#7c3aed'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => { setBrushColor(c); setIsEraser(false); }}
                                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${brushColor === c && !isEraser ? 'scale-125 border-gray-900 shadow-md ring-2 ring-indigo-100' : 'border-gray-200 hover:scale-110'}`}
                                        style={{ background: c }}
                                        title={`Brush color ${c}`}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setIsEraser(!isEraser)}
                                    className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isEraser ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                    title="Toggle Eraser"
                                >
                                    <Eraser className="w-3.5 h-3.5" /> Eraser
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Size</span>
                                {[2, 4, 8, 12].map(w => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() => setBrushWidth(w)}
                                        className={`w-6 h-6 rounded-lg font-bold border transition-colors cursor-pointer text-[10px] ${brushWidth === w ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                        title={`Brush size ${w}px`}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={clearCanvas}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-all text-xs cursor-pointer"
                            >
                                Clear Canvas
                            </button>
                            <button
                                type="button"
                                onClick={insertSketch}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-xs cursor-pointer shadow-md hover:shadow-lg flex items-center gap-1"
                            >
                                🖌️ Insert Drawing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Universal Image Insertion Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] flex flex-col gap-4 border border-gray-100 animate-slideUp">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-600" />
                                Insert Image
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-400 hover:text-gray-600 font-extrabold text-sm hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 gap-2">
                            <button
                                type="button"
                                onClick={() => setImageModalTab('upload')}
                                className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                                    imageModalTab === 'upload'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Upload from Computer
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageModalTab('url')}
                                className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                                    imageModalTab === 'url'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                Image URL
                            </button>
                        </div>

                        {imageModalTab === 'upload' ? (
                            <div className="flex flex-col gap-3">
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-8 bg-gray-50/60 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                    <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                                    <span className="text-xs font-bold text-gray-700">Click to choose image from device</span>
                                    <span className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP, GIF, SVG</span>
                                    <span className="text-[10px] text-indigo-600 font-medium mt-2 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                        💡 You can also Drag &amp; Drop or Ctrl+V directly into editor!
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isUploadingImage}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) processAndInsertImageFile(file);
                                        }}
                                    />
                                </label>
                                {isUploadingImage && (
                                    <p className="text-center text-xs font-bold text-indigo-600 animate-pulse">
                                        Processing image...
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-600">Web Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/photo.jpg"
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        className="text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-600 text-gray-700 bg-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageModal(false)}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-all text-xs cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!imageUrlInput.trim()}
                                        onClick={() => {
                                            if (imageUrlInput.trim()) {
                                                exec('insertImage', imageUrlInput.trim());
                                                setShowImageModal(false);
                                            }
                                        }}
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all text-xs cursor-pointer shadow-md"
                                    >
                                        Insert
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (isFullscreen && mounted && typeof document !== 'undefined') {
        return createPortal(editorContent, document.body);
    }

    return editorContent;
}

export default RichTextEditor;
