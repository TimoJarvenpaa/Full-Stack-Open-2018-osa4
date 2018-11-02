const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item
  }
  return blogs.length === 0 ? 0 : blogs.map(blog => blog.likes).reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (previous, current) => {
    return (previous.likes > current.likes) ? previous : current
  }
  return blogs.length === 0 ? {} : blogs.reduce(reducer)
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return {}
  } else {
    const totalBlogsByAuthor = blogs.reduce((result, item) => {
      result[item.author] = (result[item.author] || 0) + 1
      return result
    }, {})
    const reducer = (previous, current) => {
      return (previous.value > current.value) ? previous : current
    }
    const most = Object.entries(totalBlogsByAuthor).reduce(reducer)
    var output = {
      author: most[0],
      blogs: most[1]
    }
    return output
  }
}

module.exports = {
  totalLikes,
  favoriteBlog,
  mostBlogs
}