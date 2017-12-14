import { Session, User } from '@base63/identity-sdk-js'


export function inferLanguage(session: Session): string {
    if (session.hasUser()) {
        const user = session.user as User;
        if (user.language == 'en' || user.language == 'ro') {
            return user.language;
        } else {
            return 'en';
        }
    } else {
        return 'en';
    }
}
