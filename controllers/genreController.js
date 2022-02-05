const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = function (req, res) {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        let err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
  res.render("genre_form", { title: "Create genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res) {
  async.parallel(
    {
      genre: (callback) => Genre.findById(req.params.id).exec(callback),
      books: (callback) =>
        Book.find({ genre: req.params.id }, "title author")
          .populate("author")
          .exec(callback),
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        res.redirect("/catalog/genres");
      } else {
        res.render("genre_delete", {
          title: "Delete genre",
          genre: results.genre,
          books: results.books,
        });
      }
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res) {
  async.parallel(
    {
      genre: (callback) => Genre.findById(req.params.id).exec(callback),
      books: (callback) =>
        Book.find({ genre: req.params.id }, "title author")
          .populate("author")
          .exec(callback),
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.books.length > 0) {
        // Can't delete, there are books of this genre.
        res.render("genre_delete", {
          title: "Delete genre",
          genre: results.genre,
          books: results.books,
        });
        return;
      } else {
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          // Success, go to genre's list
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res) {
  Genre.findById(req.params.id).exec((err, result) => {
    // Check for errors.
    if(err) return next(err);
    if(result == null) {
      let error = new Error('Genre not found');
      error.status = 404;
      return next(error);
    }
    // Success, so render form with the genre value
    res.render('genre_form', {title: 'Update genre', genre: result})
  })
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Name must not be empty").trim().isLength({ min: 3 }).escape(),
  (req, res, next) => {
    // Check for errors on validation and sanitization. 
    const errors = validationResult(req);
    // Create the genre object
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    })

    if(!errors.isEmpty()) {
      // If there are errors. re render the page with the errors messages and the value inserted.
      res.render('genre_form', {title: 'Update genre', genre: genre, errors: errors.array()});
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, genre) => {
        if(err) return next(err);
        res.redirect(genre.url);
      })
    }
  }
]
