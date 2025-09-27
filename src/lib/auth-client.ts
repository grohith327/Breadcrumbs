// Custom auth client for our Convex-based authentication
export const authClient = {
    async signInWithMagicLink(email: string, callbackURL?: string) {
        const response = await fetch('/api/auth/sign-in/magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                callbackURL: callbackURL || window.location.origin,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send magic link');
        }

        return response.json();
    },

    async signOut() {
        // Clear the session cookie by calling a logout endpoint
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            // Reload the page to clear any cached auth state
            window.location.reload();
        }
    },

    async getSession() {
        try {
            const response = await fetch('/api/auth/session', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                return null;
            }

            return response.json();
        } catch {
            return null;
        }
    }
};

export const signIn = authClient.signInWithMagicLink;
export const signOut = authClient.signOut;