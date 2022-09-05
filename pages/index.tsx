import { Stack } from '@chakra-ui/react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import type { NextPage } from 'next'
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRecoilValue } from 'recoil';
import { communityState } from '../src/atoms/communitiesAtom';
import { Post, PostVote } from '../src/atoms/postAtom';
import CreatePostLink from '../src/components/Community/CreatePostLink';
import PersonalHome from '../src/components/Community/PersonalHome';
import Premium from '../src/components/Community/Premium';
import Recommendations from '../src/components/Community/Recommendations';
import PageContent from '../src/components/Layout/PageContent'
import PostItem from '../src/components/Posts/PostItem';
import PostLoader from '../src/components/Posts/PostLoader';
import { auth, firestore } from '../src/firebase/clientApp';
import useCommunityData from '../src/hooks/useCommunityData';
import usePosts from '../src/hooks/usePosts';

const Home: NextPage = () => {

  const [user, loadingUser ] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const {communityStateValue} = useCommunityData();
  const {setPostStateValue, postStateValue, onSelectPost, onDeletePost, onVote} = usePosts();

  const buildUserHomeFeed = async () => {
    setLoading(true);
    try{
      if(communityStateValue.mySnippets.length){

        const myCommunityIds = communityStateValue.mySnippets.map(
        (snippet => snippet.communityId) 
        );
        const postQuery = query(
          collection(firestore, 'posts'), 
          where('communityId', 'in', myCommunityIds),
          limit(10)
        );
        const postDocs = await getDocs(postQuery);
        const posts = postDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setPostStateValue(prev => ({
          ...prev, 
          posts: posts as Post[]
        }));
      }
      else{
        buildNoUserHomeFeed
      }
    }catch(error){
      console.log('buildUserHomeFeed error', error);
    }
    setLoading(false)
  };

  const buildNoUserHomeFeed = async () => {
    setLoading(true)
      try{
        const postQuery = query(collection(firestore, 'posts'),orderBy('voteStatus', 'desc'), limit(10));

        const postDocs = await getDocs(postQuery)
        const posts = postDocs.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

        setPostStateValue(prev => ({
          ...prev,
          posts: posts as Post[],

        }));

      }catch (error){
          console.log('buildNoUserHomeFeed error', error);
      }
      setLoading(false)

  };

  const getUserPostVotes = async () => {
    try{
      const postIds = postStateValue.posts.map(post => post.id);
      const postVotesQuery = query(
        collection(firestore, `users/${user?.uid}/postVotes`),
        where("postId", "in", postIds)
      );
      const postVoteDocs = await getDocs(postVotesQuery);
      const postVotes = postVoteDocs.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
      }));

      setPostStateValue(prev => ({
        ...prev,
        postVotes: postVotes as PostVote[]
      }))
    }catch(error) {
      console.log('getUserPostVotes error', error);
    }
  };


  useEffect(() => {
    if(communityStateValue.snippetsFetched) buildUserHomeFeed(); 
  }, [communityStateValue.snippetsFetched])

 useEffect(() => {
   if (!user && !loadingUser) buildNoUserHomeFeed();
 }, [user, loadingUser]);

 useEffect(() => {
      if(user && postStateValue.posts.length) getUserPostVotes();
      return () => {
        setPostStateValue((prev) => ({
          ...prev,
          postVotes: [],
        }));
      }
 }, [user, postStateValue.posts])

  return (
    <><div>
      <Head>
        <title>Reddit 2.0</title>
      </Head>
    </div><PageContent>
        <>
          <CreatePostLink />
          {loading ? (
            <PostLoader />
          ) : (
            <Stack>
              {postStateValue.posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onDeletePost={onDeletePost}
                  onVote={onVote}
                  userVoteValue={postStateValue.postVotes.find(
                    (item) => item.postId === post.id
                  )?.voteValue}
                  userIsCreator={user?.uid === post.creatorId}
                  homePage />
              ))}
            </Stack>

          )}
        </>
        <Stack spacing={5}>
          <Recommendations />
          <Premium />
          <PersonalHome />
        </Stack>
      </PageContent></>
  )
  
}

export default Home
