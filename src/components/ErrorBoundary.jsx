import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error };
  }
  componentDidCatch(error, info){
    // On peut logger ici (console ou service distant)
    console.error('ErrorBoundary caught:', error, info);
  }
  render(){
    if(this.state.hasError){
      return (
        <div style={{border:'1px solid #fecaca', background:'#fef2f2', color:'#991b1b', padding:12, borderRadius:12}}>
          <strong>Une erreur est survenue.</strong>
          <div style={{marginTop:6}} className="mono">{String(this.state.error)}</div>
          <button className="secondary" style={{marginTop:8}} onClick={()=> this.setState({ hasError:false, error:null })}>Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}
