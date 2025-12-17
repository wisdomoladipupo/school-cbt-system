"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "ghost";
};

export default function Button({
	variant = "primary",
	className = "",
	children,
	...rest
}: ButtonProps) {
	const base = "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none";
	const variants: Record<string, string> = {
		primary: `bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:brightness-90`,
		secondary: `bg-gray-100 text-gray-800 hover:bg-gray-200`,
		ghost: `bg-transparent text-[var(--color-primary)] hover:bg-gray-50`,
	};

	return (
		<button className={`${base} ${variants[variant]} ${className}`} {...rest}>
			{children}
		</button>
	);
}
