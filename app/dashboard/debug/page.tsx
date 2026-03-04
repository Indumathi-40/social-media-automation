"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function DebugPage() {
    const { user, isLoaded } = useUser();
    const whoami = useQuery(api.debug.whoami);
    const allConnections = useQuery(api.debug.listAllConnections);

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Identity Debugger</h1>

            <div className="grid grid-cols-2 gap-8">
                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold mb-4">Client-Side (Clerk)</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify({
                            isLoaded,
                            id: user?.id,
                            fullName: user?.fullName,
                            primaryEmail: user?.primaryEmailAddress?.emailAddress
                        }, null, 2)}
                    </pre>
                </div>

                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold mb-4">Server-Side (Convex Auth)</h2>
                    <pre className="text-xs overflow-auto">
                        {whoami === undefined ? "Loading..." : JSON.stringify(whoami, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="border p-4 rounded bg-blue-50">
                <h2 className="font-bold mb-4">Database Records (linkedin_connections)</h2>
                {allConnections === undefined ? (
                    <div>Loading DB...</div>
                ) : allConnections.length === 0 ? (
                    <div>No LinkedIn connections found in DB.</div>
                ) : (
                    <div className="space-y-4">
                        {allConnections.map((conn: any) => (
                            <div key={conn._id} className="border p-3 bg-white rounded text-xs font-mono">
                                <p><strong>ObjectId:</strong> {conn._id}</p>
                                <p><strong>User ID (stored):</strong> {conn.userId}</p>
                                <p><strong>LinkedIn Name:</strong> {conn.name}</p>
                                <p><strong>Match Result:</strong> {
                                    user?.id === conn.userId
                                        ? <span className="text-green-600 font-bold">MATCH</span>
                                        : <span className="text-red-600 font-bold">MISMATCH</span>
                                }</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            <div className="border p-4 rounded bg-yellow-50">
                <h2 className="font-bold mb-4">Diagnosis</h2>
                <p>
                    <strong>Clerk ID:</strong> {user?.id || "Loading..."} <br />
                    <strong>Convex Subject:</strong> {whoami?.identity?.subject || "Not Found"}
                </p>
                <p className="mt-4 text-sm text-gray-600">
                    If these two IDs do not match, or if Convex Subject is "Not Found", it means <code className="bg-gray-200 px-1">convex/auth.config.ts</code> is missing or misconfigured.
                </p>
            </div>
        </div>
    );
}
