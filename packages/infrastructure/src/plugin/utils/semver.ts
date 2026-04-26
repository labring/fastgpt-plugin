export class Semver {
  private _major: number;
  private _minor: number;
  private _patch: number;

  static getLatestOf(versions: Semver[]): Semver {
    return versions.reduce((latest, current) => {
      return latest.compare(current) > 0 ? latest : current;
    });
  }

  compare(other: Semver): number {
    if (this._major !== other._major) return this._major - other._major;
    if (this._minor !== other._minor) return this._minor - other._minor;
    return this._patch - other._patch;
  }

  constructor(version: string) {
    const [major, minor, patch] = version.split('.').map(Number);
    this._major = major;
    this._minor = minor;
    this._patch = patch;
  }

  get version(): string {
    return `${this._major}.${this._minor}.${this._patch}`;
  }
}
