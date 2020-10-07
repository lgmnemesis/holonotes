export interface User {
  user_id: string;
  email?: string;
  display_name?: string;
  profile_photo?: string;
  gender?: string;
  about?: string;
  roles?: Roles;
  isAnonymous?: boolean;
}

export interface Roles {
  subscriber?: boolean;
  admin?: boolean;
  betaTester: boolean;
}
