export class User {
  constructor(
    public id: string,
    public email: string,
    private _token: string,
    private tokenExpirationDate: Date,
  ) {}
 
  get token(): string | null {
    if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
      return null; // token istekao ili ne postoji
    }
    return this._token;
  }
}