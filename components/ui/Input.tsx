"use client";

import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string | boolean;
};

export default function Input({ label, error, className = "", ...rest }: InputProps) {
	return (
		<label className="block">
			{label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
			<input
				className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none ${className}`}
				{...rest}
			/>
			{error && <p className="mt-1 text-xs text-red-600">{typeof error === 'string' ? error : 'Invalid value'}</p>}
		</label>
	);
}
