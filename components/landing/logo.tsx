import { LucideProps } from "lucide-react";

export function SocialFlowLogo(props: LucideProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
            className={props.className}
            {...props}
        >
            <rect width="24" height="24" rx="6" className="fill-primary" />
            {/* Large star */}
            <path
                d="M10 6L11.5 9.5L15 11L11.5 12.5L10 16L8.5 12.5L5 11L8.5 9.5Z"
                fill="white"
                stroke="none"
            />
            {/* Top right star */}
            <path
                d="M17 5L17.8 6.8L19.5 7.5L17.8 8.2L17 10L16.2 8.2L14.5 7.5L16.2 6.8Z"
                fill="white"
                stroke="none"
            />
            {/* Bottom right star */}
            <path
                d="M17 13L17.6 14.4L19 15L17.6 15.6L17 17L16.4 15.6L15 15L16.4 14.4Z"
                fill="white"
                stroke="none"
            />
        </svg>
    );
}
