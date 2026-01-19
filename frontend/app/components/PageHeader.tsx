"use client";

type PageHeaderProps = {
    pageTitle: string;
    userName: string;
};

export default function PageHeader({pageTitle, userName,}: PageHeaderProps) {
    return (
        <div className="w-full bg-white px-6 py-3">
            <p className="text-sm text-gray-700">
                Selamat datang di{" "}
                <span className="font-normal font-inter">{pageTitle}</span>{" "}
                <span className="font-normal font-inter">{userName}</span>
            </p>
        </div>
    );
}
