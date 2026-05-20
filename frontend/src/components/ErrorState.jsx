function ErrorState({ title = "Something went wrong", message }) {
  return (
    <section className="error-state" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

export default ErrorState;
