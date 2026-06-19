import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CatalogueBook {
  id?: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  year: number;
}

const INITIAL_BOOKS: Omit<CatalogueBook, 'id'>[] = [
    { title: 'Majstor i Margarita', author: 'Mihail Bulgakov', genre: 'Roman', description: 'Majstorska satira o poseti đavola Moskvi koja razotkriva ljudske slabosti i licemerje.', year: 1967 },
    { title: '1984', author: 'Džordž Orvel', genre: 'Distopija', description: 'Zastrašujuća vizija totalitarnog društva u kojem su sloboda misli i privatnost ukinuti.', year: 1949 },
    { title: 'Mali Princ', author: 'Antoan de Sent Egziperi', genre: 'Bajka', description: 'Poetska i filozofska priča o dečaku sa asteroida koja nas uči o ljubavi i suštini života.', year: 1943 },
    { title: 'Zločin i kazna', author: 'Fjodor Dostojevski', genre: 'Roman', description: 'Duboka psihološka studija o griži savesti, ubistvu i potrazi za moralnim iskupljenjem.', year: 1866 },
    { title: 'Sto godina samoće', author: 'Gabrijel Garsija Markes', genre: 'Magični realizam', description: 'Epska saga o usponu i padu porodice Buendía ispisana kroz prizmu magičnog realizma.', year: 1967 },
    { title: 'Proces', author: 'Franc Kafka', genre: 'Roman', description: 'Uznemirujuća priča o pojedincu uhvaćenom u apsurdne mehanizme bezlične birokratije.', year: 1925 },
    { title: 'Stranac', author: 'Alber Kami', genre: 'Filozofski roman', description: 'Istraživanje egzistencijalnog apsurda kroz lik čoveka koji se otuđio od društvenih normi.', year: 1942 },
    { title: 'Braća Karamazovi', author: 'Fjodor Dostojevski', genre: 'Roman', description: 'Kompleksna drama o veri, moralu i sukobu generacija unutar jedne disfunkcionalne porodice.', year: 1880 },
    { title: 'Gospodar prstenova', author: 'Dž. R. R. Tolkin', genre: 'Fantastika', description: 'Epska avantura o borbi dobra i zla u fantastičnom svetu Međuzemlja.', year: 1954 },
    { title: 'Hari Poter i Kamen mudraca', author: 'Dž. K. Rouling', genre: 'Fantastika', description: 'Priča o odrastanju dečaka čarobnjaka koji otkriva tajne škole magije.', year: 1997 },
    { title: 'Slika Dorijana Greja', author: 'Oskar Vajld', genre: 'Roman', description: 'Filozofska priča o narcizmu, večitoj mladosti i neizbežnom moralnom propadanju duše.', year: 1890 },
    { title: 'Na Drini ćuprija', author: 'Ivo Andrić', genre: 'Istorijski roman', description: 'Hronika vekova kroz priču o mostu koji postaje svedok sudbina ljudi u vihoru istorije.', year: 1945 },
    { title: 'Derviš i smrt', author: 'Meša Selimović', genre: 'Roman', description: 'Duboko emotivna drama o unutrašnjem sukobu vere, pravde i ljudske patnje.', year: 1966 },
    { title: 'Seobe', author: 'Miloš Crnjanski', genre: 'Istorijski roman', description: 'Lirična saga o lutanju srpskog naroda u 18. veku u potrazi za smislom i domom.', year: 1929 },
    { title: 'Ana Karenjina', author: 'Lav Tolstoj', genre: 'Roman', description: 'Tragična povest o strastvenoj ljubavi i uništenju pod teretom krutih društvenih normi.', year: 1877 },
    { title: 'Na zapadu ništa novo', author: 'Erih Marija Remark', genre: 'Roman', description: 'Potresna priča o iskustvima vojnika u Prvom svetskom ratu.', year: 1929 },
    { title: 'Lovac u žitu', author: 'Džerom Dejvid Selindžer', genre: 'Roman', description: 'Priča o odrastanju i otuđenju tinejdžera Holdena Kolfilda.', year: 1951 },
    { title: 'Ubiti pticu rugalicu', author: 'Harper Li', genre: 'Roman', description: 'Priča o rasnoj nepravdi i moralnom odrastanju na američkom Jugu.', year: 1960 },
    { title: 'Veliki Getsbi', author: 'Frensis Skot Ficdžerald', genre: 'Roman', description: 'Kritika američkog sna kroz priču o bogatstvu i neostvarenoj ljubavi.', year: 1925 },
    { title: 'Don Kihot', author: 'Migel de Servantes', genre: 'Roman', description: 'Priča o plemiću koji gubi razum i pokušava da postane vitez lutalica.', year: 1605 }
];

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private dbUrl = environment.firebaseDatabaseUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthParams(): string {
    return `?auth=${this.authService.getToken()}`;
  }

  initCatalogue(): Observable<any> {
    const promises = INITIAL_BOOKS.map(book =>
      this.http.post(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`, book).toPromise()
    );
    return new Observable(observer => {
      Promise.all(promises).then(() => {
        observer.next(true);
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }

  getBooks(): Observable<CatalogueBook[]> {
    return this.http.get<{ [key: string]: CatalogueBook }>(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({ ...data[key], id: key }));
      })
    );
  }

  addBook(book: Omit<CatalogueBook, 'id'>): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`, book);
  }

  updateBook(id: string, book: Partial<CatalogueBook>): Observable<CatalogueBook> {
    return this.http.patch<CatalogueBook>(`${this.dbUrl}/catalogue/${id}.json${this.getAuthParams()}`, book);
  }

  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.dbUrl}/catalogue/${id}.json${this.getAuthParams()}`);
  }

  searchBooks(query: string): Observable<CatalogueBook[]> {
    return this.getBooks().pipe(
      map(books => books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase()) ||
        b.genre.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }
}