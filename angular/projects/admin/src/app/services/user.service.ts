import { Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ADMIN_THEMES,
  AdminTheme,
  ITanamUser,
  ITanamUserRole,
  TanamUser,
  TanamUserRole,
  TanamUserRoleType,
  UserQueryOptions,
} from 'tanam-models';
import { AppConfigService } from './app-config.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly siteCollection = this.firestore.collection('tanam').doc(this.appConfig.siteId);

  constructor(
    private readonly fireAuth: AngularFireAuth,
    private readonly firestore: AngularFirestore,
    private readonly appConfig: AppConfigService,
    private readonly fbApp: FirebaseApp,
    private overlayContainer: OverlayContainer
  ) {
  }

  getCurrentUser(): Observable<TanamUser> {
    const firebaseUser = this.fireAuth.auth.currentUser;
    return this.getUser(firebaseUser.uid)
      .pipe(map(user => {
        user.photoUrl = user.photoUrl || firebaseUser.photoURL;
        return user;
      }));
  }

  getUser(uid: string): Observable<TanamUser> {
    return this.siteCollection
      .collection('users').doc<ITanamUser>(uid)
      .valueChanges()
      .pipe(map((user) => new TanamUser(user)));
  }

  hasRole(role: TanamUserRoleType): Observable<boolean> {
    return this.getCurrentUser()
      .pipe(map(user => user.roles.indexOf(role) !== -1))
      .pipe(tap(result => console.log(`[UserService:hasRole] ${role}: ${result}`)));
  }

  getUserTheme(): Observable<string> {
    const firebaseUser = this.fireAuth.auth.currentUser;
    return this.siteCollection
      .collection('users').doc<ITanamUser>(firebaseUser.uid)
      .valueChanges()
      .pipe(map(tanamUser => !!tanamUser.prefs ? tanamUser.prefs : {theme: 'default'}))
      .pipe(map((prefs: { theme: AdminTheme }) => ADMIN_THEMES[prefs.theme] || ADMIN_THEMES['default']))
      .pipe(tap(theme => console.log(`[UserPrefsService:getAdminTheme] theme: ${theme}`)));
  }

  setUserTheme(theme: AdminTheme) {
    const firebaseUser = this.fireAuth.auth.currentUser;
    const docRef = this.siteCollection.collection('users').doc<ITanamUser>(firebaseUser.uid);
    return this.fbApp.firestore().runTransaction<void>(async (trx) => {
      const trxDoc = await trx.get(docRef.ref);
      const trxUser = trxDoc.data() as ITanamUser;

      const prefs = {...trxUser.prefs, theme};

      trx.update(docRef.ref, {prefs});
    });
  }

  overlayTheme() {
    const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;
    const themeClassesToRemove = Array.from(overlayContainerClasses).filter((item: string) => item.includes('-theme'));
    if (themeClassesToRemove.length) {
      overlayContainerClasses.remove(...themeClassesToRemove);
    }

    this.getUserTheme().subscribe(val => {
      this.overlayContainer.getContainerElement().classList.add(val);
    });
  }

  getUsers(queryOpts: UserQueryOptions) {
    const queryFn = (ref: CollectionReference) => {
      if (queryOpts) {
        let query: Query = ref;
        if (queryOpts.orderBy) {
          query = query.orderBy(queryOpts.orderBy.field, queryOpts.orderBy.sortOrder);
        }
        if (queryOpts.startAfter) {
          query = query.startAfter(queryOpts.startAfter);
        }
        if (queryOpts.limit) {
          query = query.limit(queryOpts.limit);
        }
        return query;
      }
      return ref;
    };
    return this.siteCollection
      .collection<ITanamUser>('users', queryFn)
      .valueChanges()
      .pipe(
        map((users) => users.map((user) => new TanamUser(user))),
      );
  }

  getUserRoles(queryOpts: UserQueryOptions): Observable<TanamUserRole[]> {
    const queryFn = (ref: CollectionReference) => {
      if (queryOpts) {
        let query: Query = ref;
        if (queryOpts.orderBy) {
          query = query.orderBy(queryOpts.orderBy.field, queryOpts.orderBy.sortOrder);
        }
        if (queryOpts.startAfter) {
          query = query.startAfter(queryOpts.startAfter);
        }
        if (queryOpts.limit) {
          query = query.limit(queryOpts.limit);
        }
        return query;
      }
      return ref;
    };
    return this.siteCollection
      .collection<ITanamUserRole>('user-roles', queryFn)
      .valueChanges()
      .pipe(
        map((roles) => roles.map((role) => new TanamUserRole(role))),
      );
  }

  inviteUser(userRole: TanamUserRole) {
    userRole.id = userRole.id || this.firestore.createId();
    return this.siteCollection
      .collection('user-roles').doc(userRole.id)
      .set(userRole.toJson());
  }

  deleteUserRole(userRole: ITanamUserRole) {
    return this.siteCollection.collection('user-roles').doc(userRole.id).delete();
  }

  getReference(id: string) {
    if (!id) {
      return;
    }
    return this.siteCollection
      .collection('users').doc(id).ref.get();
  }
}
